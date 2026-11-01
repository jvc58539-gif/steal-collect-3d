import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function createWorld(scene) {
  scene.background = new THREE.Color(0x9bd8ed);
  scene.fog = new THREE.Fog(0x9bd8ed, 55, 145);

  const hemi = new THREE.HemisphereLight(0xe9faff, 0x55704d, 2.0);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(-25, 45, 20);
  sun.castShadow = true;
  scene.add(sun);

  const group = new THREE.Group();
  scene.add(group);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({color:0x75ad62, roughness:1})
  );
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  group.add(ground);

  const roadMat = new THREE.MeshStandardMaterial({color:0x59656a, roughness:0.95});
  const road1 = new THREE.Mesh(new THREE.BoxGeometry(92,0.12,7),roadMat);
  road1.position.set(0,0.07,0); group.add(road1);
  const road2 = new THREE.Mesh(new THREE.BoxGeometry(7,0.12,92),roadMat);
  road2.position.set(0,0.075,0); group.add(road2);

  const wallMat = new THREE.MeshStandardMaterial({color:0xd7e4e6});
  for (const [x,z,w,d] of [[0,-48,100,2],[0,48,100,2],[-49,0,2,96],[49,0,2,96]]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w,4,d),wallMat);
    wall.position.set(x,2,z); group.add(wall);
  }

  const treeMat = new THREE.MeshStandardMaterial({color:0x2e7048});
  const trunkMat = new THREE.MeshStandardMaterial({color:0x765238});
  for (let i=0;i<44;i++) {
    const a = i/44*Math.PI*2;
    const r = 39 + (i%3)*2;
    const x = Math.cos(a)*r, z = Math.sin(a)*r;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.25,.38,2.2,7),trunkMat);
    trunk.position.set(x,1.1,z); group.add(trunk);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.7,4,7),treeMat);
    crown.position.set(x,3.8,z); group.add(crown);
  }

  const lake = new THREE.Mesh(
    new THREE.CircleGeometry(8,32),
    new THREE.MeshStandardMaterial({color:0x38a9cf,roughness:.25,metalness:.1})
  );
  lake.rotation.x=-Math.PI/2; lake.position.set(30,.13,28); group.add(lake);

  const bases=[];
  const positions=[[-30,-30],[-10,-30],[10,-30],[30,-30],[-30,30],[-10,30],[10,30],[30,30]];
  positions.forEach(([x,z],i)=>{
    const pad=new THREE.Mesh(new THREE.BoxGeometry(9,.25,9),new THREE.MeshStandardMaterial({color:0xb5d5a1}));
    pad.position.set(x,.18,z); group.add(pad);
    const fenceMat=new THREE.MeshStandardMaterial({color:0x8dba9a});
    for(const [dx,dz,w,d] of [[0,-4.5,9,.25],[0,4.5,9,.25],[-4.5,0,.25,9],[4.5,0,.25,9]]){
      const f=new THREE.Mesh(new THREE.BoxGeometry(w,1.2,d),fenceMat);
      f.position.set(x+dx,.8,z+dz); group.add(f);
    }
    bases.push({id:i+1,x,z});
  });

  return {group,bases};
}
