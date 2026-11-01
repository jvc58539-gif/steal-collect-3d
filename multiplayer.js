import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

export function createMultiplayer({serverUrl,playerName="Player",player, onStatus=()=>{},onPlayers=()=>{},onMessage=()=>{}}={}) {
  let socket=null,roomCode=null,players=[];
  const playerId="p_"+Math.random().toString(36).slice(2,10);
  function connect(){
    if(!serverUrl){onStatus("No server URL configured — offline mode");return false;}
    socket=io(serverUrl,{transports:["websocket","polling"],reconnection:true});
    socket.on("connect",()=>onStatus("Connected to online server"));
    socket.on("connect_error",e=>onStatus("Server connection error: "+e.message));
    socket.on("disconnect",()=>onStatus("Disconnected"));
    socket.on("room:created",d=>{roomCode=d.roomCode;players=d.players||[];onPlayers(players);onMessage("Room created: "+roomCode);});
    socket.on("room:joined",d=>{roomCode=d.roomCode;players=d.players||[];onPlayers(players);onMessage("Joined room "+roomCode);});
    socket.on("room:error",d=>onMessage(d.message||"Room error"));
    socket.on("players:update",d=>{players=d.players||[];onPlayers(players);});
    socket.on("player:moved",d=>{if(d.playerId!==playerId){const i=players.findIndex(p=>p.playerId===d.playerId);if(i<0)players.push(d);else players[i]={...players[i],...d};onPlayers(players);}});
    socket.on("player:left",d=>{players=players.filter(p=>p.playerId!==d.playerId);onPlayers(players);});
    return true;
  }
  function createRoom(){if(!socket?.connected)return onMessage("Connect to server first");socket.emit("room:create",{playerId,playerName,maxPlayers:8});}
  function joinRoom(code){if(!socket?.connected)return onMessage("Connect to server first");socket.emit("room:join",{roomCode:String(code).toUpperCase().replace(/[^A-Z0-9]/g,""),playerId,playerName});}
  function leaveRoom(){if(socket?.connected&&roomCode)socket.emit("room:leave",{roomCode,playerId});roomCode=null;players=[];onPlayers(players);}
  function update(){
    if(!socket?.connected||!roomCode||!player)return;
    const p=player.getPosition();
    socket.volatile.emit("player:move",{roomCode,playerId,position:{x:p.x,y:p.y,z:p.z}});
  }
  function disconnect(){leaveRoom();socket?.disconnect();socket=null;}
  return {connect,createRoom,joinRoom,leaveRoom,update,disconnect,getRoomCode:()=>roomCode,getPlayerId:()=>playerId};
}
