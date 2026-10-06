'use strict';
const darkMenu=menu.cloneNode(true);darkMenu.id='menu-dark';darkMenu.classList.add('menu-dark');menu.after(darkMenu);
const deck=document.querySelector('.deck');
const menuMask=document.createElement('div');menuMask.className='header-contact-mask';menu.before(menuMask);menuMask.append(menu,darkMenu);
const workMenuBackdrop=document.createElement('div');workMenuBackdrop.className='work-menu-backdrop';deck.append(workMenuBackdrop);
for(const header of [menu,darkMenu]){
 const clip=document.createElement('div');clip.className='menu-clip';header.before(clip);clip.append(header);
 const primary=document.createElement('div');primary.className='menu-primary';while(header.firstChild)primary.append(header.firstChild);header.append(primary);
}
// A single return control sits outside the section/header clipping layers.
for(const header of [menu,darkMenu])header.querySelector('.gallery-close')?.remove();
const galleryBack=document.createElement('button');galleryBack.className='gallery-close gallery-back-floating';galleryBack.type='button';galleryBack.textContent='BACK';galleryBack.inert=true;galleryBack.setAttribute('aria-hidden','true');galleryBack.setAttribute('aria-label','Back to Work');document.body.append(galleryBack);
const toTop=document.createElement('button');toTop.className='project-to-top';toTop.type='button';toTop.setAttribute('aria-label','Back to top of case');toTop.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';document.body.append(toTop);
toTop.onclick=()=>projectView?.scrollTo({top:0,behavior:reduced.matches?'auto':'smooth'});
let originState=null,closingTimer=0,projectView=null,projectRequest=0,galleryReturning=false,galleryAnimating=false;

function afterGalleryMotion(callback){
 const entry=document.querySelector('.work .gallery-entry');
 if(reduced.matches||!entry){callback();return;}
 let finished=false;
 const finish=()=>{
  if(finished)return;
  finished=true;
  entry.removeEventListener('transitionend',onEnd);
  clearTimeout(fallback);
  callback();
 };
 const onEnd=event=>{
  if(event.target===entry&&event.propertyName==='transform')finish();
 };
 entry.addEventListener('transitionend',onEnd);
 // transitionend is the source of truth; timeout is only a safety fallback.
 const fallback=setTimeout(finish,1250);
}
window.portfolioGalleryOpen=false;
const workSurface=surfaces[2];
let workAnchor=null;
function syncWorkAnchor(){workSurface.style.setProperty('--work-scroll',workSurface.scrollTop+'px');}
let workScrollFrame=0;
workSurface.addEventListener('scroll',()=>{if(workScrollFrame)return;workScrollFrame=requestAnimationFrame(()=>{workScrollFrame=0;workSurface.style.setProperty('--work-scroll',workSurface.scrollTop+'px');});},{passive:true});

/* V37: very light inertia for coarse desktop mouse-wheel input only.
   High-resolution trackpads and touch remain fully native. */
let galleryWheelFrame=0,galleryWheelTarget=0,galleryWheelActive=false;
function stopGalleryWheel(){
 if(galleryWheelFrame)cancelAnimationFrame(galleryWheelFrame);
 galleryWheelFrame=0;galleryWheelActive=false;galleryWheelTarget=workSurface.scrollTop;
}
function animateGalleryWheel(){
 const current=workSurface.scrollTop,diff=galleryWheelTarget-current;
 if(Math.abs(diff)<.45){
  workSurface.scrollTop=galleryWheelTarget;
  galleryWheelFrame=0;galleryWheelActive=false;
  return;
 }
 workSurface.scrollTop=current+diff*.24;
 galleryWheelFrame=requestAnimationFrame(animateGalleryWheel);
}
workSurface.addEventListener('wheel',event=>{
 if(!window.portfolioGalleryOpen||projectView||event.ctrlKey||reduced.matches)return;
 if(Math.abs(event.deltaX)>Math.abs(event.deltaY))return;

 const mode=event.deltaMode===1?16:event.deltaMode===2?workSurface.clientHeight:1;
 const delta=event.deltaY*mode;

 // Small pixel deltas are almost always a touchpad/high-resolution gesture:
 // leave those native so trackpad scrolling does not become sticky.
 if(event.deltaMode===0&&Math.abs(delta)<32){
  if(!galleryWheelActive)galleryWheelTarget=workSurface.scrollTop;
  return;
 }

 event.preventDefault();
 const max=Math.max(0,workSurface.scrollHeight-workSurface.clientHeight);
 if(!galleryWheelActive)galleryWheelTarget=workSurface.scrollTop;

 // Preserve input strength: a harder wheel turn travels farther, only the
 // acceleration/deceleration is softened.
 galleryWheelTarget=Math.max(0,Math.min(max,galleryWheelTarget+delta*.90));
 galleryWheelActive=true;
 if(!galleryWheelFrame)galleryWheelFrame=requestAnimationFrame(animateGalleryWheel);
},{passive:false});

workSurface.addEventListener('touchstart',stopGalleryWheel,{passive:true});

darkMenu.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>navigate(Number(button.dataset.go))));
menu.addEventListener('click',event=>{const button=event.target.closest('[data-go]');if(button&&window.portfolioGalleryOpen){event.stopImmediatePropagation();navigate(Number(button.dataset.go));}},true);
function navigate(index){if(window.portfolioGalleryOpen)closeGallery(index);else go(index);}
function openGallery(event){
 event?.preventDefault();
 if(window.portfolioGalleryOpen||galleryReturning||galleryAnimating)return;

 galleryAnimating=true;
 window.beginDeckTransition?.();
 workAnchor=null;
 clearTimeout(closingTimer);
 originState={index:active,scroll:workSurface.scrollTop,focus:document.activeElement};

 // First render the "before" frame explicitly. This prevents the browser from
 // collapsing preview -> gallery into one layout/paint and producing a snap.
 document.body.classList.remove('gallery-closing');
 document.body.classList.add('gallery-transitioning','gallery-opening');

 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  window.portfolioGalleryOpen=true;
  document.querySelectorAll('.gallery-close').forEach(b=>{
   b.inert=false;
   b.setAttribute('aria-hidden','false');
  });

  document.body.classList.add('gallery-mode');
  window.endDeckTransition?.();
  document.dispatchEvent(new Event('gallery-mode-change'));

  workSurface.tabIndex=-1;
  workSurface.focus({preventScroll:true});

  afterGalleryMotion(()=>{
   document.body.classList.remove('gallery-opening','gallery-transitioning');
   galleryAnimating=false;
   window.syncMenu?.();
  });
 }));
}
function closeGallery(destination){
 if(galleryReturning||galleryAnimating||!window.portfolioGalleryOpen)return;
 if(projectView)closeProject();

 // Navigating to another deck section keeps the established V18 behavior.
 // The staged controller below is specifically for the BACK -> WORK transition.
 if(destination!==undefined&&destination!==originState.index){
  galleryReturning=true;
  const savedWorkScroll=workSurface.scrollTop;
  workAnchor=null;
  workSurface.style.setProperty('--work-scroll',savedWorkScroll+'px');

  window.beginDeckTransition?.();
  projectRequest++;
  closeDetail();
  window.portfolioGalleryOpen=false;
  document.body.classList.add('gallery-closing');
  document.body.classList.remove('gallery-mode');
  document.querySelectorAll('.gallery-close').forEach(b=>{
   b.inert=true;
   b.setAttribute('aria-hidden','true');
  });
  workSurface.scrollTop=savedWorkScroll;
  go(destination);
  window.endDeckTransition?.();
  window.syncMenu?.();
  document.dispatchEvent(new Event('gallery-mode-change'));

  closingTimer=setTimeout(()=>{
   document.body.classList.remove('gallery-closing');
   galleryReturning=false;
   workSurface.scrollTop=savedWorkScroll;
   workSurface.style.setProperty('--work-scroll',savedWorkScroll+'px');
   window.syncMenu?.();
  },reduced.matches?0:1000);
  return;
 }

 galleryReturning=true;
 galleryAnimating=true;
 const savedWorkScroll=workSurface.scrollTop;
 workAnchor=null;
 workSurface.style.setProperty('--work-scroll',savedWorkScroll+'px');

 projectRequest++;
 closeDetail();

 // Keep the fully expanded gallery painted for one frame after the user clicks
 // BACK, then start every reverse motion from that exact visible state.
 document.body.classList.add('gallery-transitioning','gallery-closing');

 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  window.beginDeckTransition?.();
  window.portfolioGalleryOpen=false;

  document.querySelectorAll('.gallery-close').forEach(b=>{
   b.inert=true;
   b.setAttribute('aria-hidden','true');
  });

  document.body.classList.remove('gallery-mode');
  workSurface.scrollTop=savedWorkScroll;

  originState.focus?.focus({preventScroll:true});

  window.endDeckTransition?.();
  document.dispatchEvent(new Event('gallery-mode-change'));

  afterGalleryMotion(()=>{
   // Do not apply any anchor correction: exact scrollTop survives the whole move.
   workSurface.scrollTop=savedWorkScroll;
   workSurface.style.setProperty('--work-scroll',savedWorkScroll+'px');

   document.body.classList.remove('gallery-closing','gallery-transitioning');
   galleryReturning=false;
   galleryAnimating=false;
   window.syncMenu?.();
  });
 }));
}
document.querySelector('.gallery-launch').addEventListener('click',openGallery);
document.querySelectorAll('.gallery-close').forEach(b=>b.addEventListener('click',()=>projectView?closeProject():closeGallery()));
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&window.portfolioGalleryOpen){if(projectView){event.stopImmediatePropagation();closeProject();}else if(!selected)closeGallery();}},true);

// ---------------- Fixed header compositor ----------------
// The header itself never changes left/width. Light and dark copies remain
// pixel-aligned; only their visible cuts follow the physical deck boundaries.
const position=panel=>new DOMMatrixReadOnly(getComputedStyle(panel).transform).m41;
let baseRight=[],workSpineWidth=0;
function measureHeaderGeometry(){
 baseRight=panels.map(panel=>panel.getBoundingClientRect().right-position(panel));
 workSpineWidth=panels[2].querySelector('.spine')?.getBoundingClientRect().width||0;
}
measureHeaderGeometry();
function rail(){const n=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rail'));return Number.isFinite(n)?n:0;}
function desiredMenuShift(page=Number(document.body.dataset.page||0),gallery=window.portfolioGalleryOpen){return gallery?0:Math.min(page,2)*rail();}
function clipHeader(header,leftEdge,rightEdge,viewport=document.documentElement.clientWidth){
 const target=header.parentElement?.classList.contains('menu-clip')?header.parentElement:header;
 const left=Math.max(0,Math.min(viewport,leftEdge));
 const right=Math.max(left,Math.min(viewport,rightEdge));
 target.style.clip=`rect(0px, ${right}px, 9999px, ${left}px)`;
 const hidden=right-left<.5;header.style.visibility=hidden?'hidden':'visible';header.inert=hidden;header.setAttribute('aria-hidden',String(hidden));
}
function paintMenu(state=null,contactProgress=null){
 const viewport=document.documentElement.clientWidth;
 const x=state?.x||panels.map(position);
 const page=state?.page??Number(document.body.dataset.page||0);
 const gallery=state?.gallery??window.portfolioGalleryOpen;
 const galleryProgress=Math.max(0,Math.min(1,state?.galleryProgress??(gallery?1:0)));
 const shift=state?.shift??desiredMenuShift(page,gallery);
 menuMask.style.setProperty('--menu-shift',shift+'px');
 const introEdge=baseRight[0]+x[0];
 const aboutEdge=baseRight[1]+x[1];
 const workEdge=baseRight[2]+x[2];
 // In gallery mode the same fixed header is revealed continuously from the
 // moving panel geometry. No instant "full dark header" branch.
 const foldedLightEnd=Math.max(0,Math.min(viewport,Math.max(introEdge,aboutEdge)));
 // Independent clip for the filter tray: it must live BEHIND the returning
 // INTRO/ABOUT rails, not paint over them. This edge is taken directly from
 // the physical panel geometry, so it moves smoothly with the rails.
 menuMask.style.setProperty('--filter-left',foldedLightEnd+'px');
 document.documentElement.style.setProperty('--filter-left',foldedLightEnd+'px');
 const lightEnd=foldedLightEnd*(1-galleryProgress);
 let cp=contactProgress;
 if(cp==null)cp=page===3?1:0;
 cp=Math.max(0,Math.min(1,cp));
 // Clip the fixed header by the REAL physical left edge of the WORK spine.
 // In gallery mode the WORK spine itself slides one rail to the right,
 // so galleryProgress is part of that same physical boundary.
 const workSpineLeft=Math.max(0,Math.min(
  viewport,
  workEdge-workSpineWidth*(1-galleryProgress)
 ));
 menuMask.style.width=workSpineLeft+'px';
 const visibleRight=workSpineLeft;
 clipHeader(menu,0,Math.min(lightEnd,visibleRight),viewport);
 clipHeader(darkMenu,lightEnd,visibleRight,viewport);
 // Matte belongs to WORK: its RIGHT edge follows WORK itself, never the
 // CONTACTS text mask. Because this layer sits in the deck below ABOUT, the
 // small overlap is genuinely underneath ABOUT rather than on top of it.
 const overlap=1*(1-galleryProgress);
 const bgLeft=Math.max(0,lightEnd-overlap);
 const matteRight=Math.max(0,Math.min(viewport,workEdge));
 const bgRight=Math.max(bgLeft,matteRight);
 const rightInset=Math.max(0,viewport-bgRight);
 workMenuBackdrop.style.clipPath=`inset(0 ${rightInset}px 0 ${bgLeft}px)`;
 workMenuBackdrop.style.webkitClipPath=`inset(0 ${rightInset}px 0 ${bgLeft}px)`;
}

// Panel movement keeps the original visual geometry, but the header is sampled
// from the SAME tween rather than running its own left/width transition.
let motionFrame=0,motionDepth=0,motionFrom=null,motionFromPage=0,motionFromGallery=false;
function snapshot(){const page=Number(document.body.dataset.page||0),gallery=window.portfolioGalleryOpen;return {x:panels.map(position),page,gallery,galleryProgress:gallery?1:0,shift:desiredMenuShift(page,gallery)};}
function contactProgress(fromPage,toPage,k,fromGallery,toGallery){
 if(fromPage===3&&toPage!==3)return 1-k;
 if(fromPage!==3&&toPage===3)return k;
 return toPage===3?1:0;
}
function setMotion(state,cp){panels.forEach((panel,i)=>panel.style.transform=`translate3d(${state.x[i]}px,0,0)`);paintMenu(state,cp);}
function makeDeckEase(){const values=getComputedStyle(document.documentElement).getPropertyValue('--ease').match(/[.\d]+/g)?.map(Number)||[.22,.61,.36,1];const [x1,y1,x2,y2]=values;const curve=(v,a,b)=>3*(1-v)*(1-v)*v*a+3*(1-v)*v*v*b+v*v*v;return function deckEase(t){let low=0,high=1;for(let i=0;i<16;i++){const middle=(low+high)/2;if(curve(middle,x1,x2)<t)low=middle;else high=middle;}return curve((low+high)/2,y1,y2);};}
function unlockDeckMotion(){
 requestAnimationFrame(()=>document.documentElement.classList.remove('deck-motion-lock'));
}
window.beginDeckTransition=function(){
 if(motionDepth++>0)return;
 cancelAnimationFrame(motionFrame);motionFrame=0;
 // The JS compositor is the sole owner of panel transforms during a deck move.
 // Prevent the CSS transition from lagging one frame behind each JS update.
 document.documentElement.classList.add('deck-motion-lock');
 motionFrom=snapshot();motionFromPage=motionFrom.page;motionFromGallery=motionFrom.gallery;
};
window.endDeckTransition=function(){
 if(--motionDepth>0)return;motionDepth=0;
 if(!motionFrom){document.documentElement.classList.remove('deck-motion-lock');return;}
 const from=motionFrom;motionFrom=null;

 // With CSS panel transitions locked, removing the temporary transform reveals
 // the exact final class-based geometry immediately, which is safe to sample.
 panels.forEach(p=>p.style.removeProperty('transform'));
 const to=snapshot();
 const raw=getComputedStyle(document.documentElement).getPropertyValue('--duration').trim(),duration=(reduced.matches||window.portfolioRestoring)?0:parseFloat(raw)*(raw.endsWith('ms')?1:1000);

 if(!duration){
  setMotion(to,contactProgress(from.page,to.page,1,from.gallery,to.gallery));
  panels.forEach(p=>p.style.removeProperty('transform'));
  paintMenu(to,contactProgress(from.page,to.page,1,from.gallery,to.gallery));
  unlockDeckMotion();
  return;
 }

 const started=performance.now(),deckEase=makeDeckEase();
 setMotion(from,contactProgress(from.page,to.page,0,from.gallery,to.gallery));

 function tick(now){
  const t=Math.min(1,(now-started)/duration),k=deckEase(t);
  const state={x:from.x.map((x,i)=>x+(to.x[i]-x)*k),page:to.page,gallery:to.gallery,galleryProgress:from.galleryProgress+(to.galleryProgress-from.galleryProgress)*k,shift:from.shift+(to.shift-from.shift)*k};
  setMotion(state,contactProgress(from.page,to.page,k,from.gallery,to.gallery));

  if(t<1){
   motionFrame=requestAnimationFrame(tick);
  }else{
   motionFrame=0;
   // Land on the exact CSS end state while transitions are still locked.
   panels.forEach(p=>p.style.removeProperty('transform'));
   syncWorkAnchor();
   paintMenu(to,contactProgress(from.page,to.page,1,from.gallery,to.gallery));
   unlockDeckMotion();
  }
 }
 motionFrame=requestAnimationFrame(tick);
};
window.syncMenu=()=>paintMenu();
function resizeDeck(){cancelAnimationFrame(motionFrame);motionFrame=0;motionDepth=0;motionFrom=null;panels.forEach(p=>p.style.removeProperty('transform'));document.documentElement.classList.remove('deck-motion-lock');measureHeaderGeometry();paintMenu();}
window.addEventListener('resize',resizeDeck,{passive:true});window.addEventListener('pageshow',paintMenu);document.addEventListener('visibilitychange',paintMenu);window.visualViewport?.addEventListener('resize',resizeDeck,{passive:true});paintMenu();

const returnScroll=sessionStorage.getItem('panxrt-gallery-return');
if(returnScroll!==null){sessionStorage.removeItem('panxrt-gallery-return');go(2);openGallery();workSurface.scrollTop=Number(returnScroll)||0;}

function closeProject(){
 projectRequest++;
 if(!projectView)return;
 projectView.remove();projectView=null;toTop.classList.remove('is-visible');document.body.classList.remove('project-mode');document.dispatchEvent(new Event('project-mode-change'));workSurface.inert=false;
 document.querySelectorAll('.gallery-close').forEach(b=>{b.textContent='BACK';b.setAttribute('aria-label','Close gallery');});
 (Array.from(grid.children).find(card=>card.dataset.id===document.getElementById('case-link').dataset.workId)?.querySelector('button')||workSurface).focus({preventScroll:true});window.translatePage?.(false);
}
document.getElementById('case-link').addEventListener('click',async event=>{
 if(!window.portfolioGalleryOpen||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 event.preventDefault();grid.querySelectorAll('video').forEach(v=>v.muted=true);const link=event.currentTarget,request=++projectRequest;
 link.setAttribute('aria-busy','true');
 try{
  const caseId=new URL(link.href).pathname.split('/').pop().replace('.html','');
  const work=window.portfolioData?.works.find(w=>w.id===link.dataset.workId);
  const content=work?window.buildProjectContent(work):document.getElementById('case-template-'+caseId)?.content.querySelector('.case-main');
  if(!content)throw new Error('Project unavailable');
  if(request!==projectRequest||!window.portfolioGalleryOpen)return;
  projectView=document.createElement('section');projectView.className='project-view';projectView.dataset.workId=link.dataset.workId||'';projectView.setAttribute('aria-label',content.querySelector('h1')?.textContent||'Project');projectView.tabIndex=-1;
  projectView.append(work?content:document.importNode(content,true));document.body.append(projectView);document.body.classList.add('project-mode');workSurface.inert=true;document.dispatchEvent(new Event('project-mode-change'));
  projectView.addEventListener('scroll',()=>toTop.classList.toggle('is-visible',projectView.scrollTop>240),{passive:true});
  projectView.querySelector('.case-back')?.addEventListener('click',e=>{e.preventDefault();closeProject();});
  document.querySelectorAll('.gallery-close').forEach(b=>{b.textContent='BACK';b.setAttribute('aria-label','Close project and return to gallery');});
  document.dispatchEvent(new CustomEvent('analytics-case',{detail:link.dataset.workId||''}));projectView.focus({preventScroll:true});window.translatePage?.(false);
 }catch(error){document.getElementById('announcement').textContent='Could not load the project. Please try again.';}
 finally{link.removeAttribute('aria-busy');}
});

document.addEventListener('portfolio-language',()=>{if(!projectView)return;const work=window.portfolioData?.works.find(w=>w.id===projectView.dataset.workId);if(!work)return;const scroll=projectView.scrollTop;projectView.replaceChildren(window.buildProjectContent(work));projectView.querySelector('.case-back')?.addEventListener('click',e=>{e.preventDefault();closeProject();});projectView.scrollTop=scroll;});
