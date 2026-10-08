(()=>{
  const setup=()=>{
    const section=document.querySelector("#how");
    if(!section||section.dataset.bbOrderStage)return;
    const grid=section.querySelector(".wrap.grid12");
    if(!grid)return;
    const columns=Array.from(grid.children).filter((node)=>node instanceof HTMLElement);
    const markers=columns.find((node)=>node.querySelector("ol"));
    const originalStage=columns.find((node)=>node!==markers&&node.querySelector("svg.symbol-box"));
    const steps=markers?Array.from(markers.querySelectorAll(":scope > ol > li")):[];
    const source=originalStage?.querySelector("svg.symbol-box")||markers?.querySelector("svg.symbol-box");
    if(!markers||!source||steps.length===0)return;

    section.dataset.bbOrderStage="true";
    grid.classList.add("bb-order-presentation");
    markers.classList.add("bb-order-markers");
    originalStage?.classList.add("bb-order-original-stage");

    const topics=steps.map((step)=>{
      const title=step.querySelector(".h3")?.textContent?.trim()||step.querySelector("button")?.textContent?.trim()||"";
      return{title};
    });

    const stage=document.createElement("div");
    stage.className="bb-order-stage";
    stage.setAttribute("aria-live","polite");
    const copy=document.createElement("div");
    copy.className="bb-order-stage__copy";
    const counter=document.createElement("p");
    counter.className="bb-order-stage__step mono";
    const title=document.createElement("h3");
    title.className="bb-order-stage__title";
    copy.append(counter,title);
    const figure=document.createElement("div");
    figure.className="bb-order-stage__figure";

    const box=source.cloneNode(true);
    box.className.baseVal="symbol-box bb-order-stage__svg";
    box.removeAttribute("data-bb-ready");
    box.classList.remove("bb-play","bb-was-played");
    box.querySelectorAll(".bb-closed-lid").forEach((node)=>node.remove());
    Array.from(box.children).forEach((node)=>node.classList?.remove("bb-flap"));
    const clip=box.querySelector("clipPath");
    if(clip){
      const oldId=clip.id;
      clip.id="bb-order-stage-clip";
      box.querySelectorAll(`[clip-path="url(#${oldId})"]`).forEach((node)=>node.setAttribute("clip-path","url(#bb-order-stage-clip)"));
    }
    const symbols=Array.from(box.querySelectorAll(".symbol"));
    symbols.forEach((symbol)=>symbol.setAttribute("data-out","false"));
    figure.appendChild(box);
    stage.append(copy,figure);
    grid.insertBefore(stage,markers);

    let active=-1;
    const setActive=(index)=>{
      if(index===active||index<0||index>=topics.length)return;
      active=index;
      counter.textContent=`${index+1}/${topics.length}`;
      title.textContent=topics[index].title;
      symbols.forEach((symbol,i)=>symbol.setAttribute("data-out",String(i===index)));
      stage.dataset.active=String(index);
    };
    setActive(0);

    const observer=new IntersectionObserver((entries)=>{
      const visible=entries.filter((entry)=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(visible)setActive(steps.indexOf(visible.target));
    },{threshold:[0,0.15,0.35,0.65],rootMargin:"-42% 0px -42% 0px"});
    steps.forEach((step)=>observer.observe(step));
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();
