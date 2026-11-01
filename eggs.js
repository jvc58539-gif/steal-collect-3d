import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function createEggSystem(scene, player, onCollect=()=>{}) {
  const group=new THREE.Group();scene.add(group);
  const types=[
    {name:"Common",color:0xf2f2f2,reward:5},
    {name:"Rare",color:0x42a5ff,reward:15},
    {name:"Epic",color:0xb45cff,reward:35},
    {name:"Legendary",color:0xffc533,reward:75}
  ];
  const eggs=[];let coins=0,total=0;
  for(let i=0;i<24;i++){
    const t=types[Math.floor(Math.random()*types.length)];
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(.48,18,14),new THREE.MeshStandardMaterial({color:t.color,emissive:t.color,emissiveIntensity:.22}));
    mesh.scale.y=1.25;mesh.position.set((Math.random()-.5)*70,.8,(Math.random()-.5)*70);
    group.add(mesh);eggs.push({mesh,type:t,active:true,phase:Math.random()*6});
  }
  function update(dt){
    for(const e of eggs)if(e.active){e.mesh.rotation.y+=dt*1.2;e.mesh.position.y=.8+Math.sin(performance.now()*.002+e.phase)*.15;}
  }
  function tryCollect(){
    const p=player.getPosition();
    let best=null,dist=2.8;
    for(const e of eggs){if(!e.active)continue;const d=p.distanceTo(e.mesh.position);if(d<dist){dist=d;best=e;}}
    if(!best)return false;
    best.active=false;best.mesh.visible=false;coins+=best.type.reward;total++;
    onCollect({type:best.type.name,reward:best.type.reward,coins,total});
    setTimeout(()=>{best.active=true;best.mesh.visible=true;},12000);
    return true;
  }
  return {group,update,tryCollect,getCoins:()=>coins,getTotalCollected:()=>total,addCoins:n=>{coins+=Math.max(0,Number(n)||0);}};
}
