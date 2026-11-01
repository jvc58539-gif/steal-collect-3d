import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import {createWorld} from "./world.js";
import {createPlayer} from "./player.js";
import {createEggSystem} from "./eggs.js";
import {createShop} from "./shop.js";
import {createBaseSystem} from "./base.js";
import {createMultiplayer} from "./multiplayer.js";

const mount=document.getElementById("game");
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,220);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
mount.appendChild(renderer.domElement);

const world=createWorld(scene);
let player=null,eggs=null,shop=null,baseSystem=null,multiplayer=null;
let offline=false;
const lobby=document.getElementById("lobby");
const hud=document.getElementById("hud");
const status=document.getElementById("lobby-status");
const notice=document.getElementById("notice");
const coinsLabel=document.getElementById("coins");
const playersLabel=document.getElementById("players-label");
const roomLabel=document.getElementById("room-label");

function say(text){notice.textContent=text;clearTimeout(say.timer);say.timer=setTimeout(()=>notice.textContent="Collect glowing eggs!",2200);}
function startGame(){
  if(player)return;
  const name=document.getElementById("player-name").value.trim()||"Player";
  player=createPlayer(scene,camera,renderer);
  eggs=createEggSystem(scene,player,data=>{say(`${data.type} egg +${data.reward} coins`);coinsLabel.textContent=`Coins: ${data.coins}`;});
  baseSystem=createBaseSystem(scene,world,"local");
  shop=createShop(eggs,say,n=>coinsLabel.textContent=`Coins: ${n}`);
  document.getElementById("collect").addEventListener("pointerdown",e=>{e.preventDefault();if(!eggs.tryCollect())say("No egg nearby");});
  lobby.classList.add("hidden");hud.classList.remove("hidden");
  document.getElementById("joystick").classList.remove("hidden");
  document.getElementById("buttons").classList.remove("hidden");
  say("Welcome "+name+"! Find the glowing eggs.");
}
function setupOnline(){
  if(!player)startGame();
  const serverUrl=window.GAME_SERVER_URL||"";
  multiplayer=createMultiplayer({
    serverUrl,playerName:document.getElementById("player-name").value,player,
    onStatus:s=>status.textContent=s,
    onMessage:s=>say(s),
    onPlayers:list=>{playersLabel.textContent=`Players: ${Math.max(1,list.length)}/8`;renderRemotePlayers(list);}
  });
  multiplayer.connect();
  return multiplayer;
}
const remoteMeshes=new Map();
function renderRemotePlayers(list){
  for(const data of list){
    if(!data.playerId||data.playerId===multiplayer?.getPlayerId())continue;
    let mesh=remoteMeshes.get(data.playerId);
    if(!mesh){
      mesh=new THREE.Group();
      const body=new THREE.Mesh(new THREE.BoxGeometry(.8,1.2,.5),new THREE.MeshStandardMaterial({color:0xe0a52b}));
      body.position.y=1.1;mesh.add(body);
      const head=new THREE.Mesh(new THREE.SphereGeometry(.35,12,10),new THREE.MeshStandardMaterial({color:0xffc89c}));
      head.position.y=1.95;mesh.add(head);scene.add(mesh);remoteMeshes.set(data.playerId,mesh);
    }
    if(data.position)mesh.position.set(data.position.x||0,data.position.y||0,data.position.z||0);
  }
  const ids=new Set(list.map(p=>p.playerId));
  for(const [id,mesh] of remoteMeshes){if(!ids.has(id)){scene.remove(mesh);remoteMeshes.delete(id);}}
}

document.getElementById("play-offline").addEventListener("click",()=>{offline=true;startGame();roomLabel.textContent="Offline practice";});
document.getElementById("create-room").addEventListener("click",()=>{
  setupOnline();
  if(!multiplayer)return;
  if(!window.GAME_SERVER_URL){status.textContent="Add your hosted server URL in game.js first.";return;}
  setTimeout(()=>multiplayer.createRoom(),500);
});
document.getElementById("join-room").addEventListener("click",()=>{
  setupOnline();
  const code=document.getElementById("room-code").value;
  if(!window.GAME_SERVER_URL){status.textContent="Add your hosted server URL in game.js first.";return;}
  setTimeout(()=>multiplayer.joinRoom(code),500);
});
document.getElementById("shop").addEventListener("click",()=>{});
window.addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
});
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  if(player)player.update(dt);
  if(eggs)eggs.update(dt);
  if(multiplayer)multiplayer.update();
  renderer.render(scene,camera);
}
animate();
