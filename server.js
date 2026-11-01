const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingInterval: 25000,
  pingTimeout: 20000
});

app.get("/", (_req, res) => res.send("Steal & Collect multiplayer server is running."));
app.get("/health", (_req, res) => res.json({ ok: true }));

const rooms = new Map();
const playerRoom = new Map();
const MAX_PLAYERS = 8;

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join("");
  } while (rooms.has(code));
  return code;
}
function safeName(value) {
  return String(value || "Player").replace(/[<>]/g,"").trim().slice(0,20) || "Player";
}
function roomPlayers(room) {
  return Array.from(room.players.values()).map(p => ({
    playerId:p.playerId, playerName:p.playerName, position:p.position
  }));
}
function leave(socket) {
  const code = playerRoom.get(socket.id);
  if (!code) return;
  const room = rooms.get(code);
  if (room) {
    const player = room.players.get(socket.id);
    room.players.delete(socket.id);
    socket.to(code).emit("player:left",{playerId:player?.playerId});
    if (room.players.size === 0) rooms.delete(code);
    else io.to(code).emit("players:update",{players:roomPlayers(room)});
  }
  playerRoom.delete(socket.id);
}
io.on("connection", socket => {
  socket.on("room:create", (data, ack=()=>{}) => {
    leave(socket);
    const code=makeCode();
    const player={playerId:String(data.playerId||socket.id),playerName:safeName(data.playerName),position:{x:0,y:0,z:0}};
    const room={players:new Map([[socket.id,player]])};
    rooms.set(code,room);playerRoom.set(socket.id,code);socket.join(code);
    const result={success:true,roomCode:code,players:roomPlayers(room)};
    socket.emit("room:created",result);ack(result);
  });
  socket.on("room:join",(data,ack=()=>{})=>{
    const code=String(data.roomCode||"").toUpperCase();
    const room=rooms.get(code);
    if(!room){const r={success:false,message:"Room not found"};socket.emit("room:error",r);ack(r);return;}
    if(room.players.size>=MAX_PLAYERS){const r={success:false,message:"Room is full (8 players maximum)"};socket.emit("room:error",r);ack(r);return;}
    leave(socket);
    const player={playerId:String(data.playerId||socket.id),playerName:safeName(data.playerName),position:{x:0,y:0,z:0}};
    room.players.set(socket.id,player);playerRoom.set(socket.id,code);socket.join(code);
    const result={success:true,roomCode:code,players:roomPlayers(room)};
    socket.emit("room:joined",result);
    socket.to(code).emit("player:joined",player);
    io.to(code).emit("players:update",{players:roomPlayers(room)});
    ack(result);
  });
  socket.on("room:leave",(_data,ack=()=>{})=>{leave(socket);ack({success:true});});
  socket.on("room:reconnect",(data,ack=()=>{})=>{
    const code=String(data.roomCode||"").toUpperCase(),room=rooms.get(code);
    if(!room||room.players.size>=MAX_PLAYERS){ack({success:false});return;}
    const player={playerId:String(data.playerId||socket.id),playerName:safeName(data.playerName),position:{x:0,y:0,z:0}};
    room.players.set(socket.id,player);playerRoom.set(socket.id,code);socket.join(code);
    const result={success:true,roomCode:code,players:roomPlayers(room)};
    socket.emit("room:joined",result);io.to(code).emit("players:update",{players:roomPlayers(room)});ack(result);
  });
  socket.on("player:move",data=>{
    const code=playerRoom.get(socket.id);
    if(!code||code!==data.roomCode)return;
    const room=rooms.get(code),p=room?.players.get(socket.id);
    if(!p||!data.position)return;
    const {x,y,z}=data.position;
    if(![x,y,z].every(Number.isFinite))return;
    p.position={x:Math.max(-45,Math.min(45,x)),y:Math.max(0,Math.min(10,y)),z:Math.max(-45,Math.min(45,z))};
    socket.to(code).volatile.emit("player:moved",{playerId:p.playerId,position:p.position});
  });
  socket.on("disconnect",()=>leave(socket));
});
const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log(`Multiplayer server listening on ${PORT}`));
