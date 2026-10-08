(()=>{
  const setup=()=>{
    const section=document.querySelector("#how");
    if(!section)return false;
    if(section.querySelector(".bb-order-stage"))return true;

    const grid=section.querySelector(".wrap.grid12");
    if(!grid)return false;
    const columns=Array.from(grid.children).filter((node)=>node instanceof HTMLElement);
    const markers=columns.find((node)=>node.querySelector(":scope > ol"));
    const originalStage=columns.find((node)=>node!==markers&&node.querySelector("svg.symbol-box"));
    const steps=markers?Array.from(markers.querySelectorAll(":scope > ol > li")):[];
    const source=originalStage?.querySelector("svg.symbol-box")||markers?.querySelector("svg.symbol-box");
    if(!markers||!source||steps.length===0)return false;

    section.dataset.bbOrderStage="true";
    grid.classList.add("bb-order-presentation");
    markers.classList.add("bb-order-markers");
    originalStage?.classList.add("bb-order-original-stage");

    const topics=steps.map((step)=>({
      title:step.querySelector(".h3")?.textContent?.trim()||step.querySelector("button")?.textContent?.trim()||""
    }));

    const stage=document.createElement("div");
    stage.className="bb-order-stage";
    stage.setAttribute("aria-live","polite");
    const copy=document.createElement("div");
    copy.className="bb-order-stage__copy";
    const eyebrow=document.createElement("p");
    eyebrow.className="bb-order-stage__eyebrow mono";
    eyebrow.textContent=document.documentElement.lang==="en"?"ONE ORDER":"JEDNA OBJEDNÁVKA";
    const counter=document.createElement("p");
    counter.className="bb-order-stage__step mono";
    const title=document.createElement("h3");
    title.className="bb-order-stage__title";
    copy.append(eyebrow,counter,title);
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
      const newId=`bb-order-stage-clip-${Math.random().toString(36).slice(2,8)}`;
      clip.id=newId;
      box.querySelectorAll(`[clip-path="url(#${oldId})"]`).forEach((node)=>node.setAttribute("clip-path",`url(#${newId})`));
    }
    const symbols=Array.from(box.querySelectorAll(".symbol"));
    symbols.forEach((symbol)=>symbol.setAttribute("data-out","false"));
    figure.appendChild(box);
    stage.append(copy,figure);
    grid.insertBefore(stage,markers);

    let active=-1;
    const setActive=(index)=>{
      if(index===active||index<0||index>=topics.length)return;
      const hadActive=active>=0;
      active=index;
      counter.textContent=`${index+1}/${topics.length}`;
      title.textContent=topics[index].title;
      symbols.forEach((symbol,i)=>symbol.setAttribute("data-out",String(i===index)));
      stage.dataset.active=String(index);
      if(hadActive&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
        title.animate([
          {opacity:.15,transform:"translateY(18px)"},
          {opacity:1,transform:"translateY(0)"}
        ],{duration:720,easing:"cubic-bezier(.22,1,.36,1)"});
      }
    };
    setActive(0);

    let ticking=false;
    const updateActive=()=>{
      ticking=false;
      const target=Math.max(120,window.innerHeight*.52);
      let closest=0;
      let distance=Infinity;
      steps.forEach((step,index)=>{
        const rect=step.getBoundingClientRect();
        const current=Math.abs(rect.top+rect.height*.5-target);
        if(current<distance){
          distance=current;
          closest=index;
        }
      });
      setActive(closest);
    };
    const queueUpdate=()=>{
      if(ticking)return;
      ticking=true;
      requestAnimationFrame(updateActive);
    };
    window.addEventListener("scroll",queueUpdate,{passive:true});
    window.addEventListener("resize",queueUpdate,{passive:true});
    requestAnimationFrame(updateActive);
    return true;
  };

  const boot=()=>{
    let attempts=0;
    const trySetup=()=>{
      if(setup()||attempts++>30)return;
      setTimeout(trySetup,120);
    };
    setTimeout(trySetup,900);
  };
  if(document.readyState==="complete")boot();else window.addEventListener("load",boot,{once:true});
})();
