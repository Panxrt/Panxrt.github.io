'use strict';
const panels=[...document.querySelectorAll('.panel')];
const surfaces=panels.map(panel=>panel.querySelector('.surface'));
const names=['Intro','About','Work','Contact'];
const menu=document.getElementById('menu');
let active=0,lockedUntil=0,wheelTotal=0,lastWheel=0;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
function go(index){
 if(window.portfolioGalleryOpen)return;
 index=Math.max(0,Math.min(panels.length-1,index));
 if(index===active&&document.body.dataset.page!==undefined)return;
 window.beginDeckTransition?.();
 const old=active;active=index;
 document.body.dataset.page=String(active);
 document.documentElement.style.setProperty('--active',String(active));
 panels.forEach((panel,i)=>{
  panel.classList.toggle('passed',i<active);
  surfaces[i].inert=i!==active;
  surfaces[i].scrollTop=0;
  surfaces[i].classList.remove('reveal');
  if(i===active)requestAnimationFrame(()=>surfaces[i].classList.add('reveal'));
  const spine=panel.querySelector('.spine');
  if(spine){spine.tabIndex=i<active?0:-1;spine.disabled=i>=active;}
 });
 document.querySelectorAll('.menu [data-go]').forEach(button=>{if(Number(button.dataset.go)===active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
 document.querySelectorAll('.deck-controls [data-go]').forEach(button=>{if(Number(button.dataset.go)===active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
 history.replaceState(null,'','#'+names[active].toLowerCase());
 window.endDeckTransition?.();
 document.getElementById('announcement').textContent=names[active]+', section '+(active+1)+' of 4';
 lockedUntil=Date.now()+(reduced.matches?180:1300);wheelTotal=0;
 if(old!==active){
  const focused=document.activeElement;
  if(surfaces[old].contains(focused)||(active===3&&menu.contains(focused))){
   surfaces[active].tabIndex=-1;surfaces[active].focus({preventScroll:true});
  }
 }
}
document.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>go(Number(button.dataset.go))));
window.addEventListener('wheel',event=>{
 if(window.portfolioGalleryOpen||event.ctrlKey)return;
 const horizontal=Math.abs(event.deltaX)>Math.abs(event.deltaY);
 const delta=(horizontal?event.deltaX:event.deltaY)*(event.deltaMode===1?16:event.deltaMode===2?window.innerHeight:1);
 event.preventDefault();
 const now=Date.now();if(now<lockedUntil){lastWheel=now;wheelTotal=0;return;}
 if(now-lastWheel>180||Math.sign(delta)!==Math.sign(wheelTotal))wheelTotal=0;
 lastWheel=now;wheelTotal+=delta;
 if(Math.abs(wheelTotal)>90)go(active+Math.sign(wheelTotal));
},{passive:false});
window.addEventListener('keydown',event=>{
 if(window.portfolioGalleryOpen)return;
 if(event.altKey||event.metaKey||event.ctrlKey||event.target.matches('input,textarea,select,[contenteditable="true"]'))return;
 let destination;
 if(event.key==='ArrowRight')destination=active+1;
 if(event.key==='ArrowLeft')destination=active-1;
 if(event.key==='Home')destination=0;
 if(event.key==='End')destination=panels.length-1;
 if(destination!==undefined){event.preventDefault();go(destination);}
});
let touchStart=null;
const touchDeck=document.querySelector('.deck');
touchDeck.addEventListener('touchstart',event=>{
 touchStart=null;
 if(window.portfolioGalleryOpen||event.touches.length!==1||Date.now()<lockedUntil)return;
 const t=event.touches[0];touchStart={x:t.clientX,y:t.clientY,id:t.identifier};
},{passive:true});
touchDeck.addEventListener('touchmove',event=>{
 if(window.portfolioGalleryOpen)return;
 if(event.touches.length!==1){touchStart=null;return;}
 // The deck owns one-finger gestures; gallery scrolling remains browser-native.
 if(event.cancelable)event.preventDefault();
},{passive:false});
touchDeck.addEventListener('touchend',event=>{
 if(window.portfolioGalleryOpen||!touchStart)return;
 const start=touchStart;touchStart=null;
 const t=[...event.changedTouches].find(t=>t.identifier===start.id);
 if(!t||Date.now()<lockedUntil)return;
 const dx=t.clientX-start.x,dy=t.clientY-start.y;
 // Normal scroll-down gesture (finger moving up) advances the horizontal deck.
 // Retain horizontal swipes as an optional alternative.
 const distance=Math.abs(dy)>=Math.abs(dx)?dy:dx;
 if(Math.abs(distance)>45)go(active+(distance<0?1:-1));
},{passive:true});
touchDeck.addEventListener('touchcancel',()=>{touchStart=null;},{passive:true});
const initial=names.findIndex(name=>name.toLowerCase()===location.hash.slice(1));
go(initial<0?0:initial);
window.addEventListener('hashchange',()=>{const index=names.findIndex(name=>name.toLowerCase()===location.hash.slice(1));if(index>=0)go(index);});
const ribbon=document.getElementById('brand-ribbon');ribbon.addEventListener('click',()=>{const paused=ribbon.classList.toggle('paused');ribbon.setAttribute('aria-pressed',String(paused));ribbon.setAttribute('aria-label',(paused?'Resume':'Pause')+' brand animation');ribbon.title=paused?'Resume animation':'Pause animation';});
