'use strict';
const darkMenu=menu.cloneNode(true);darkMenu.id='menu-dark';darkMenu.classList.add('menu-dark');menu.after(darkMenu);
const deck=document.querySelector('.deck');
const menuMask=document.createElement('div');menuMask.className='header-contact-mask';menu.before(menuMask);menuMask.append(menu,darkMenu);
const workMenuBackdrop=document.createElement('div');workMenuBackdrop.className='work-menu-backdrop';menuMask.prepend(workMenuBackdrop);
for(const header of [menu,darkMenu]){
 const clip=document.createElement('div');clip.className='menu-clip';header.before(clip);clip.append(header);
 const primary=document.createElement('div');primary.className='menu-primary';while(header.firstChild)primary.append(header.firstChild);header.append(primary);
}
// A single return control sits outside the section/header clipping layers.
for(const header of [menu,darkMenu])header.querySelector('.gallery-close')?.remove();
const galleryBack=document.createElement('button');galleryBack.className='gallery-close gallery-back-floating';galleryBack.type='button';galleryBack.textContent='BACK';galleryBack.inert=true;galleryBack.setAttribute('aria-hidden','true');galleryBack.setAttribute('aria-label','Back to Work');document.body.append(galleryBack);
const toTop=document.createElement('button');toTop.className='project-to-top';toTop.type='button';toTop.setAttribute('aria-label','Back to top of case');toTop.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';document.body.append(toTop);
toTop.onclick=()=>projectView?.scrollTo({top:0,behavior:reduced.matches?'auto':'smooth'});
let originState=null,closingTimer=0,projectView=null,projectRequest=0,galleryReturning=false;
window.portfolioGalleryOpen=false;
const workSurface=surfaces[2];
let workAnchor=null;
function syncWorkAnchor(){workSurface.style.setProperty('--work-scroll',workSurface.scrollTop+'px');}
let workScrollFrame=0;
workSurface.addEventListener('scroll',()=>{if(workScrollFrame)return;workScrollFrame=requestAnimationFrame(()=>{workScrollFrame=0;workSurface.style.setProperty('--work-scroll',workSurface.scrollTop+'px');});},{passive:true});

darkMenu.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>navigate(Number(button.dataset.go))));
menu.addEventListener('click',event=>{const button=event.target.closest('[data-go]');if(button&&window.portfolioGalleryOpen){event.stopImmediatePropagation();navigate(Number(button.dataset.go));}},true);
function navigate(index){if(window.portfolioGalleryOpen)closeGallery(index);else go(index);}
function openGallery(event){
 event?.preventDefault();if(window.portfolioGalleryOpen||galleryReturning)return;
 window.beginDeckTransition?.();
 workAnchor=null;clearTimeout(closingTimer);originState={index:active,scroll:workSurface.scrollTop,focus:document.activeElement};
 window.portfolioGalleryOpen=true;
 document.querySelectorAll('.gallery-close').forEach(b=>{b.inert=false;b.setAttribute('aria-hidden','false');});
 document.body.classList.remove('gallery-closing');document.body.classList.add('gallery-mode');
 window.endDeckTransition?.();window.syncMenu?.();document.dispatchEvent(new Event('gallery-mode-change'));workSurface.tabIndex=-1;workSurface.focus({preventScroll:true});
}
function closeGallery(destination){
 if(galleryReturning||!window.portfolioGalleryOpen)return;
 galleryReturning=true;
 if(projectView)closeProject();
 // Preserve the exact scroll coordinate. The visual return is handled only by
 // CSS transitions, so there is no last-frame scroll correction/jump.
 workAnchor=null;
 const savedWorkScroll=workSurface.scrollTop;
 workSurface.style.setProperty('--work-scroll',savedWorkScroll+'px');
 window.beginDeckTransition?.();
 projectRequest++;closeDetail();window.portfolioGalleryOpen=false;
 syncWorkAnchor();
 document.body.classList.add('gallery-closing');document.body.classList.remove('gallery-mode');
 document.querySelectorAll('.gallery-close').forEach(b=>{b.inert=true;b.setAttribute('aria-hidden','true');});
 if(destination!==undefined&&destination!==originState.index)go(destination);
 else originState.focus?.focus({preventScroll:true});
 window.endDeckTransition?.();window.syncMenu?.();document.dispatchEvent(new Event('gallery-mode-change'));
 closingTimer=setTimeout(()=>{
  document.body.classList.remove('gallery-closing');
  galleryReturning=false;
  workSurface.scrollTop=savedWorkScroll;
  workSurface.style.setProperty('--work-scroll',savedWorkScroll+'px');
  window.syncMenu?.();
 },reduced.matches?0:1100);
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
 const shift=state?.shift??desiredMenuShift(page,gallery);
 menuMask.style.setProperty('--menu-shift',shift+'px');
 const introEdge=baseRight[0]+x[0];
 const aboutEdge=baseRight[1]+x[1];
 const workEdge=baseRight[2]+x[2];
 const lightEnd=Math.max(0,Math.min(viewport,Math.max(introEdge,aboutEdge)));
 let cp=contactProgress;
 if(cp==null)cp=page===3?1:0;
 cp=Math.max(0,Math.min(1,cp));
 // CONTACTS progressively masks the whole fixed header right -> left.
 const headerRight=viewport*(1-cp);
 menuMask.style.width=headerRight+'px';
 const visibleRight=Math.max(0,Math.min(headerRight,workEdge));
 clipHeader(menu,0,Math.min(lightEnd,headerRight),viewport);
 clipHeader(darkMenu,lightEnd,visibleRight,viewport);
 // The frosted Work surface extends slightly under ABOUT's rounded edge so
 // there can never be a transparent rectangular gap at the seam.
 const hasDarkRegion=visibleRight>lightEnd+.5;
 const overlap=hasDarkRegion?Math.min(28,workSpineWidth*.6||28):0;
 const bgLeft=Math.max(0,lightEnd-overlap),bgRight=hasDarkRegion?Math.max(bgLeft,visibleRight):bgLeft;
 const rightInset=Math.max(0,viewport-bgRight);
 workMenuBackdrop.style.clipPath=`inset(0 ${rightInset}px 0 ${bgLeft}px)`;
 workMenuBackdrop.style.webkitClipPath=`inset(0 ${rightInset}px 0 ${bgLeft}px)`;
}

// Panel movement keeps the original visual geometry, but the header is sampled
// from the SAME tween rather than running its own left/width transition.
let motionFrame=0,motionDepth=0,motionFrom=null,motionFromPage=0,motionFromGallery=false;
function snapshot(){const page=Number(document.body.dataset.page||0),gallery=window.portfolioGalleryOpen;return {x:panels.map(position),page,gallery,shift:desiredMenuShift(page,gallery)};}
function contactProgress(fromPage,toPage,k){
 if(fromPage===3&&toPage!==3)return 1-k;
 if(fromPage!==3&&toPage===3)return k;
 return toPage===3?1:0;
}
function setMotion(state,cp){panels.forEach((panel,i)=>panel.style.transform=`translate3d(${state.x[i]}px,0,0)`);paintMenu(state,cp);}
function makeDeckEase(){const values=getComputedStyle(document.documentElement).getPropertyValue('--ease').match(/[.\d]+/g)?.map(Number)||[.22,.61,.36,1];const [x1,y1,x2,y2]=values;const curve=(v,a,b)=>3*(1-v)*(1-v)*v*a+3*(1-v)*v*v*b+v*v*v;return function deckEase(t){let low=0,high=1;for(let i=0;i<16;i++){const middle=(low+high)/2;if(curve(middle,x1,x2)<t)low=middle;else high=middle;}return curve((low+high)/2,y1,y2);};}
window.beginDeckTransition=function(){if(motionDepth++>0)return;cancelAnimationFrame(motionFrame);motionFrom=snapshot();motionFromPage=motionFrom.page;motionFromGallery=motionFrom.gallery;};
window.endDeckTransition=function(){
 if(--motionDepth>0)return;motionDepth=0;if(!motionFrom)return;
 const from=motionFrom;motionFrom=null;
 panels.forEach(p=>p.style.removeProperty('transform'));
 const to=snapshot();
 const raw=getComputedStyle(document.documentElement).getPropertyValue('--duration').trim(),duration=(reduced.matches||window.portfolioRestoring)?0:parseFloat(raw)*(raw.endsWith('ms')?1:1000);
 if(!duration){setMotion(to,contactProgress(from.page,to.page,1));panels.forEach(p=>p.style.removeProperty('transform'));return;}
 const started=performance.now(),deckEase=makeDeckEase();
 setMotion(from,contactProgress(from.page,to.page,0));
 function tick(now){
  const t=Math.min(1,(now-started)/duration),k=deckEase(t);
  const state={x:from.x.map((x,i)=>x+(to.x[i]-x)*k),page:to.page,gallery:to.gallery,shift:from.shift+(to.shift-from.shift)*k};
  setMotion(state,contactProgress(from.page,to.page,k));
  if(t<1)motionFrame=requestAnimationFrame(tick);else{motionFrame=0;panels.forEach(p=>p.style.removeProperty('transform'));syncWorkAnchor();paintMenu(to,contactProgress(from.page,to.page,1));}
 }
 motionFrame=requestAnimationFrame(tick);
};
window.syncMenu=()=>paintMenu();
function resizeDeck(){cancelAnimationFrame(motionFrame);motionFrame=0;panels.forEach(p=>p.style.removeProperty('transform'));measureHeaderGeometry();paintMenu();}
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
