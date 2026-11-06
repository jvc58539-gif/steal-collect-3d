const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

app.use(express.static(__dirname));

app.get("/health", (req, res) => {
  res.json({ status: "online" });
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();
const MAX_PLAYERS = 8;

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  do {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));

  return code;
}

function getRoom(socket) {
  return rooms.get(socket.data.roomCode);
}

function sendPlayers(code) {
  const room = rooms.get(code);
  if (!room) return;

  io.to(code).emit("players:update", {
    players: Array.from(room.players.values())
  });
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("room:create", (data = {}, callback) => {
    const code = makeCode();

    const player = {
      playerId: socket.id,
      name: data.name || "Player",
      x: 0,
      y: 0,
      z: 0
    };

    rooms.set(code, {
      players: new Map([[socket.id, player]])
    });

    socket.join(code);
    socket.data.roomCode = code;

    const result = { success: true, code, players: [player] };

    socket.emit("room:created", result);
    if (typeof callback === "function") callback(result);

    sendPlayers(code);
  });

  socket.on("room:join", (data = {}, callback) => {
    const code = String(data.code || "").toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      const result = { success: false, message: "Room not found" };
      socket.emit("room:error", result);
      if (typeof callback === "function") callback(result);
      return;
    }

    if (room.players.size >= MAX_PLAYERS) {
      const result = { success: false, message: "Room is full" };
      socket.emit("room:error", result);
      if (typeof callback === "function") callback(result);
      return;
    }

    const player = {
      playerId: socket.id,
      name: data.name || "Player",
      x: 0,
      y: 0,
      z: 0
    };

    room.players.set(socket.id, player);
    socket.join(code);
    socket.data.roomCode = code;

    const result = {
      success: true,
      code,
      players: Array.from(room.players.values())
    };

    socket.emit("room:joined", result);
    if (typeof callback === "function") callback(result);

    sendPlayers(code);
  });

  socket.on("room:leave", () => {
    leaveRoom(socket);
  });

  socket.on("player:move", (data = {}) => {
    const room = getRoom(socket);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    player.x = Number(data.x) || 0;
    player.y = Number(data.y) || 0;
    player.z = Number(data.z) || 0;

    socket.to(socket.data.roomCode).emit("player:moved", {
      playerId: socket.id,
      x: player.x,
      y: player.y,
      z: player.z
    });
  });

  socket.on("disconnect", () => {
    leaveRoom(socket);
    console.log("Player disconnected:", socket.id);
  });
});

function leaveRoom(socket) {
  const code = socket.data.roomCode;
  if (!code) return;

  const room = rooms.get(code);

  if (room) {
    room.players.delete(socket.id);

    if (room.players.size === 0) {
      rooms.delete(code);
    } else {
      sendPlayers(code);
    }
  }

  socket.leave(code);
  delete socket.data.roomCode;
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("Game server running on port " + PORT);
});
