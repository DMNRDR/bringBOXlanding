(()=>{
  const SVG_NS="http://www.w3.org/2000/svg";
  let observer;
  const prepare=(svg)=>{
    if(svg.dataset.bbReady)return;
    const directGroups=Array.from(svg.children).filter((node)=>node.tagName&&node.tagName.toLowerCase()==="g");
    const symbolLayer=directGroups.find((group)=>group.querySelector(".symbol"));
    if(!symbolLayer)return;
    directGroups.slice(0,4).forEach((group)=>group.classList.add("bb-flap"));
    const lid=document.createElementNS(SVG_NS,"g");
    lid.classList.add("bb-closed-lid");
    const polygon=document.createElementNS(SVG_NS,"polygon");
    polygon.setAttribute("points","-256.1,-131.4 59.1,-254.5 256.1,-128.4 -59.1,-5.3");
    polygon.setAttribute("fill","#111110");
    polygon.setAttribute("stroke","#FFC81A");
    polygon.setAttribute("stroke-width","3");
    polygon.setAttribute("stroke-linejoin","round");
    lid.appendChild(polygon);
    svg.insertBefore(lid,symbolLayer);
    svg.dataset.bbReady="true";
    observer.observe(svg);
  };
  const scan=()=>document.querySelectorAll("svg.symbol-box").forEach(prepare);
  const start=()=>{
    if(observer)return;
    observer=new IntersectionObserver((entries)=>{
      for(const entry of entries){
        const svg=entry.target;
        if(entry.isIntersecting&&entry.intersectionRatio>=0.58){
          svg.classList.add("bb-was-played","bb-play");
        }else if(!entry.isIntersecting||entry.intersectionRatio<=0.18){
          svg.classList.remove("bb-play");
        }
      }
    },{threshold:[0,0.18,0.58],rootMargin:"-6% 0px -6% 0px"});
    scan();
    new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  };
  const boot=()=>setTimeout(start,700);
  if(document.readyState==="complete")boot();else window.addEventListener("load",boot,{once:true});
})();
