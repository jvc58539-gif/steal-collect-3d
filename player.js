import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function createPlayer(scene, camera, renderer, color=0x287be0) {
  const object=new THREE.Group();
  const mat=new THREE.MeshStandardMaterial({color,roughness:.75});
  const skin=new THREE.MeshStandardMaterial({color:0xffc89c});
  const body=new THREE.Mesh(new THREE.BoxGeometry(.85,1.05,.48),mat);
  body.position.y=1.25; object.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.38,16,12),skin);
  head.position.y=2.05; object.add(head);
  const legs=[];
  for(let i=0;i<2;i++){
    const leg=new THREE.Mesh(new THREE.BoxGeometry(.28,.75,.3),new THREE.MeshStandardMaterial({color:0x26364e}));
    leg.position.set(i===0?-.23:.23,.42,0); object.add(leg); legs.push(leg);
  }
  const arms=[];
  for(let i=0;i<2;i++){
    const arm=new THREE.Mesh(new THREE.BoxGeometry(.23,.78,.25),skin);
    arm.position.set(i===0?-.58:.58,1.35,0); object.add(arm); arms.push(arm);
  }
  object.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  scene.add(object);

  let yaw=0,vy=0,grounded=true,moveX=0,moveZ=0,running=false;
  let dragging=false,lastX=0,lastY=0,pitch=.28;
  const joystick=document.getElementById("joystick");
  const stick=document.getElementById("stick");
  const jump=document.getElementById("jump");
  const run=document.getElementById("run");
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  if(joystick&&stick){
    const update=e=>{
      const r=joystick.getBoundingClientRect();
      const dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
      const len=Math.max(1,Math.hypot(dx,dy)),m=Math.min(42,len);
      stick.style.transform=`translate(${dx/len*m}px,${dy/len*m}px)`;
      moveX=clamp(dx/42,-1,1); moveZ=clamp(dy/42,-1,1);
    };
    joystick.addEventListener("pointerdown",e=>{joystick.setPointerCapture(e.pointerId);update(e);});
    joystick.addEventListener("pointermove",e=>{if(e.buttons)update(e);});
    const stop=()=>{moveX=0;moveZ=0;stick.style.transform="translate(0,0)";};
    joystick.addEventListener("pointerup",stop);joystick.addEventListener("pointercancel",stop);
  }
  jump?.addEventListener("pointerdown",e=>{e.preventDefault();if(grounded){vy=8;grounded=false;}});
  run?.addEventListener("pointerdown",()=>running=true);
  run?.addEventListener("pointerup",()=>running=false);
  run?.addEventListener("pointercancel",()=>running=false);

  renderer.domElement.addEventListener("pointerdown",e=>{
    if(e.clientX<innerWidth*.35)return;
    dragging=true;lastX=e.clientX;lastY=e.clientY;
  });
  renderer.domElement.addEventListener("pointermove",e=>{
    if(!dragging)return;
    yaw-=(e.clientX-lastX)*.006;
    pitch=clamp(pitch+(e.clientY-lastY)*.003,-.15,.85);
    lastX=e.clientX;lastY=e.clientY;
  });
  window.addEventListener("pointerup",()=>dragging=false);

  function update(dt){
    const speed=running?8:4.5;
    const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
    const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
    const dir=forward.multiplyScalar(-moveZ).add(right.multiplyScalar(moveX));
    if(dir.lengthSq()>0.01){
      dir.normalize();object.position.addScaledVector(dir,speed*dt);
      object.rotation.y=Math.atan2(dir.x,dir.z);
      const t=performance.now()*.012*(running?1.7:1);
      legs[0].rotation.x=Math.sin(t)*.65;legs[1].rotation.x=-Math.sin(t)*.65;
      arms[0].rotation.x=-Math.sin(t)*.35;arms[1].rotation.x=Math.sin(t)*.35;
    }else{legs.forEach(l=>l.rotation.x=0);arms.forEach(a=>a.rotation.x=0);}
    vy-=19*dt;object.position.y+=vy*dt;
    if(object.position.y<0){object.position.y=0;vy=0;grounded=true;}
    object.position.x=THREE.MathUtils.clamp(object.position.x,-44,44);
    object.position.z=THREE.MathUtils.clamp(object.position.z,-44,44);
    const target=new THREE.Vector3(object.position.x,object.position.y+1.4,object.position.z);
    const offset=new THREE.Vector3(Math.sin(yaw)*9,4+pitch*5,Math.cos(yaw)*9);
    camera.position.lerp(target.clone().add(offset),1-Math.pow(.001,dt));
    camera.lookAt(target);
  }
  return {
    object, update,
    getPosition:()=>object.position.clone(),
    getMoving:()=>Math.abs(moveX)+Math.abs(moveZ)>.05,
    getRunning:()=>running,
    getGrounded:()=>grounded,
    setPosition:(x,y,z)=>object.position.set(x,y,z),
    dispose:()=>scene.remove(object)
  };
}
