export function createShop(eggSystem, notify=()=>{}, updateCoins=()=>{}) {
  let open=false;
  const panel=document.getElementById("shop-panel");
  document.getElementById("shop")?.addEventListener("click",()=>{open=true;panel?.classList.remove("hidden");});
  document.getElementById("close-shop")?.addEventListener("click",()=>{open=false;panel?.classList.add("hidden");});
  document.getElementById("buy-egg")?.addEventListener("click",()=>{
    if(eggSystem.getCoins()<25){notify("Not enough coins!");return;}
    eggSystem.addCoins(-25);
    notify("Mystery egg purchased! (Egg shop prototype)");
    updateCoins(eggSystem.getCoins());
  });
  return {isOpen:()=>open,close:()=>{open=false;panel?.classList.add("hidden");}};
}
