(()=>{
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const language=document.documentElement.lang==="en"?"en":"sk";
  const labels=language==="en"
    ?{hint:"Click or swipe",previous:"Previous slide",next:"Next slide"}
    :{hint:"Klikni alebo potiahni",previous:"Predchádzajúci krok",next:"Ďalší krok"};
  const decks=[];
  let animation=0;
  let busyUntil=0;
  let lastTouch=0;
  let wheelQuiet;
  let wheelInProgress=false;

  const navHeight=()=>document.querySelector(".site-nav")?.getBoundingClientRect().height||65;
  const absoluteTop=(element)=>scrollY+element.getBoundingClientRect().top;
  const ease=(value)=>1-Math.pow(1-value,3);
  const scrollToY=(target,duration=1000)=>{
    cancelAnimationFrame(animation);
    const from=scrollY;
    const distance=target-from;
    if(reduced.matches||Math.abs(distance)<2){window.scrollTo(0,target);return}
    const start=performance.now();
    const frame=(now)=>{
      const progress=Math.min(1,(now-start)/duration);
      window.scrollTo(0,from+distance*ease(progress));
      if(progress<1)animation=requestAnimationFrame(frame);
    };
    animation=requestAnimationFrame(frame);
  };
  const boxPosition=(index)=>{
    const deck=decks.find((item)=>item.kind==="box");
    if(!deck)return scrollY;
    const start=absoluteTop(deck.track)-navHeight();
    const end=absoluteTop(deck.track)+deck.track.offsetHeight-innerHeight;
    return start+(end-start)*index/(deck.count-1);
  };
  const current=(deck)=>{
    if(deck.kind==="how")return Number(deck.stage.dataset.active||0);
    if(typeof deck.index==="number")return deck.index;
    const start=boxPosition(0),end=boxPosition(deck.count-1);
    return Math.max(0,Math.min(deck.count-1,Math.round((scrollY-start)/(end-start)*(deck.count-1))));
  };
  const syncNav=(deck)=>{
    const index=current(deck);
    deck.stage.dataset.presentationStep=String(index);
    deck.nav.querySelector(".bb-presentation-count").textContent=deck.kind==="box"
      ?index===0?"●":`${index}/${deck.count-1}`
      :`${index+1}/${deck.count}`;
  };
  const exit=(deck,direction)=>{
    const destination=direction>0?deck.section.nextElementSibling:deck.section.previousElementSibling;
    if(!destination)return;
    const target=direction>0
      ?absoluteTop(destination)-navHeight()
      :absoluteTop(destination)+destination.offsetHeight-innerHeight;
    busyUntil=performance.now()+800;
    scrollToY(Math.max(0,target),850);
  };
  const advance=(deck,direction)=>{
    if(performance.now()<busyUntil)return;
    const index=current(deck);
    const next=index+direction;
    if(next<0||next>=deck.count){exit(deck,direction);return}
    busyUntil=performance.now()+(reduced.matches?180:1150);
    deck.index=next;
    if(deck.kind==="box")scrollToY(boxPosition(next),1050);
    else deck.stage.bbSetActive(next);
    syncNav(deck);
  };
  const entrance=(deck,direction)=>{
    const index=direction>0?0:deck.count-1;
    deck.index=index;
    busyUntil=performance.now()+650;
    if(deck.kind==="box")scrollToY(boxPosition(index),750);
    else scrollToY(absoluteTop(deck.stage)-navHeight(),750);
    if(deck.kind==="how")deck.stage.bbSetActive(index);
    syncNav(deck);
  };
  const visibleDeck=(direction=1)=>{
    for(const deck of decks){
      const rect=deck.stage.getBoundingClientRect();
      const visible=Math.min(rect.bottom,innerHeight)-Math.max(rect.top,navHeight());
      if(visible<Math.min(rect.height*.3,170))continue;
      if(direction>0&&rect.top>navHeight()+12)return{deck,enter:true};
      if(direction<0&&rect.bottom<innerHeight-12)return{deck,enter:true};
      if(rect.top<=navHeight()+12&&rect.bottom>=innerHeight*.55)return{deck,enter:false};
    }
    return null;
  };
  const makeNav=(deck)=>{
    const nav=document.createElement("div");
    nav.className="bb-presentation-nav mono";
    nav.innerHTML=`<span class="bb-presentation-hint">${labels.hint}</span><button type="button" class="bb-presentation-prev" aria-label="${labels.previous}">↑</button><span class="bb-presentation-count" aria-hidden="true"></span><button type="button" class="bb-presentation-next" aria-label="${labels.next}">↓</button>`;
    nav.querySelector(".bb-presentation-prev").addEventListener("click",(event)=>{event.stopPropagation();advance(deck,-1)});
    nav.querySelector(".bb-presentation-next").addEventListener("click",(event)=>{event.stopPropagation();advance(deck,1)});
    deck.stage.appendChild(nav);
    deck.nav=nav;
    syncNav(deck);
  };
  const wireStage=(deck)=>{
    deck.stage.classList.add("bb-presentation-interactive");
    makeNav(deck);
    deck.stage.addEventListener("click",(event)=>{
      if(Date.now()-lastTouch<650||event.target.closest("button,a"))return;
      const view=visibleDeck(1);
      if(view?.deck===deck&&view.enter)entrance(deck,1);
      else advance(deck,1);
    });
    let gesture=null;
    deck.stage.addEventListener("touchstart",(event)=>{
      if(event.touches.length!==1||event.target.closest("button,a")){gesture=null;return}
      gesture={x:event.touches[0].clientX,y:event.touches[0].clientY};
    },{passive:true});
    deck.stage.addEventListener("touchmove",(event)=>{
      if(gesture&&event.touches.length===1)event.preventDefault();
    },{passive:false});
    deck.stage.addEventListener("touchend",(event)=>{
      if(!gesture||!event.changedTouches.length)return;
      const dx=event.changedTouches[0].clientX-gesture.x;
      const dy=event.changedTouches[0].clientY-gesture.y;
      gesture=null;
      if(Math.max(Math.abs(dx),Math.abs(dy))<36)return;
      lastTouch=Date.now();
      const direction=Math.abs(dy)>=Math.abs(dx)?dy<0?1:-1:dx<0?1:-1;
      const view=visibleDeck(direction);
      if(view?.deck===deck&&view.enter)entrance(deck,direction);
      else advance(deck,direction);
    },{passive:true});
  };
  const setup=()=>{
    const boxSection=document.querySelector("#box");
    const boxTrack=boxSection?.querySelector(".box-track");
    const boxStage=boxSection?.querySelector(".box-stage");
    const howSection=document.querySelector("#how");
    const howStage=howSection?.querySelector(".bb-order-stage");
    if(!boxTrack||!boxStage||!howStage||!howStage.bbSetActive)return false;
    boxTrack.removeAttribute("aria-hidden");
    boxStage.setAttribute("role","region");
    boxStage.setAttribute("aria-label",language==="en"?"Inside the box presentation":"Prezentácia Čo je v krabici");
    boxStage.querySelector(".box-hint")?.remove();
    decks.push({kind:"box",section:boxSection,stage:boxStage,track:boxTrack,count:5,index:undefined});
    decks.push({kind:"how",section:howSection,stage:howStage,count:howStage.bbSlideCount,index:0});
    decks.forEach(wireStage);
    document.addEventListener("wheel",(event)=>{
      if(event.ctrlKey||event.target.closest(".site-nav"))return;
      const direction=Math.sign(event.deltaY);
      if(!direction)return;
      const target=visibleDeck(direction);
      if(!target)return;
      event.preventDefault();
      clearTimeout(wheelQuiet);
      wheelQuiet=setTimeout(()=>{wheelInProgress=false},220);
      if(wheelInProgress)return;
      wheelInProgress=true;
      if(target.enter)entrance(target.deck,direction);
      else advance(target.deck,direction);
    },{passive:false,capture:true});
    document.addEventListener("keydown",(event)=>{
      if(event.altKey||event.ctrlKey||event.metaKey||event.target.closest("input,textarea,select,[contenteditable=true]"))return;
      const forward=["ArrowDown","ArrowRight","PageDown"," "];
      const backward=["ArrowUp","ArrowLeft","PageUp"];
      const direction=forward.includes(event.key)?1:backward.includes(event.key)?-1:0;
      if(!direction)return;
      const target=visibleDeck(direction);
      if(!target)return;
      event.preventDefault();
      if(target.enter)entrance(target.deck,direction);
      else advance(target.deck,direction);
    });
    window.addEventListener("scroll",()=>{
      const box=decks[0];
      if(performance.now()<busyUntil)return;
      box.index=undefined;
      syncNav(box);
    },{passive:true});
    return true;
  };
  const boot=()=>{
    let attempts=0;
    const trySetup=()=>{if(setup()||attempts++>40)return;setTimeout(trySetup,150)};
    setTimeout(trySetup,1300);
  };
  if(document.readyState==="complete")boot();else window.addEventListener("load",boot,{once:true});
})();
