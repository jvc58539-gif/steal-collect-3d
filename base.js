import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function createBaseSystem(scene, worldData, playerId="local") {
  const bases=worldData.bases.map((b,i)=>({...b,owner:null,locked:true}));
  function claimBase(){
    const mine=bases.find(b=>b.owner===playerId);
    if(mine)return mine;
    const free=bases.find(b=>!b.owner);
    if(!free)return null;
    free.owner=playerId;return free;
  }
  function getMyBase(){return bases.find(b=>b.owner===playerId)||null;}
  function setLocked(value){const b=getMyBase();if(!b)return false;b.locked=!!value;return true;}
  function canSteal(baseId,visitorId){
    const b=bases.find(x=>x.id===baseId);
    return !!b&&b.owner!==visitorId&&!b.locked;
  }
  claimBase();
  return {bases,claimBase,getMyBase,setLocked,canSteal,getBaseCount:()=>bases.length};
}
