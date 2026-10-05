'use strict';
// Each section owns its own header. This makes the header move/reveal with
// the physical slide itself instead of relying on a separate viewport mask.
const introMenu=menu;
introMenu.classList.add('section-menu','intro-section-menu');

const aboutMenu=menu.cloneNode(true);
aboutMenu.id='menu-about';
aboutMenu.classList.add('section-menu','about-section-menu');

const darkMenu=menu.cloneNode(true);
darkMenu.id='menu-dark';
darkMenu.classList.add('menu-dark','section-menu','work-section-menu');

for(const header of [introMenu,aboutMenu,darkMenu]){
 const primary=document.createElement('div');
 primary.className='menu-primary';
 while(header.firstChild)primary.append(header.firstChild);
 header.append(primary);
}

panels[0].append(introMenu);
panels[1].append(aboutMenu);
panels[2].append(darkMenu);

// A single return control sits outside the section/header clipping layers.
for(const header of [introMenu,aboutMenu,darkMenu])header.querySelector('.gallery-close')?.remove();
const galleryBack=document.createElement('button');galleryBack.className='gallery-close gallery-back-floating';galleryBack.type='button';galleryBack.textContent='BACK';galleryBack.inert=true;galleryBack.setAttribute('aria-hidden','true');galleryBack.setAttribute('aria-label','Back to Work');document.body.append(galleryBack);
const toTop=document.createElement('button');toTop.className='project-to-top';toTop.type='button';toTop.setAttribute('aria-label','Back to top of case');toTop.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';document.body.append(toTop);
toTop.onclick=()=>projectView?.scrollTo({top:0,behavior:reduced.matches?'auto':'smooth'});
let originState=null,closingTimer=0,projectView=null,projectRequest=0,galleryReturning=false;
window.portfolioGalleryOpen=false;
const workSurface=surfaces[2];
let workAnchor=null;
let workScrollFrame=0;
workSurface.addEventListener('scroll',()=>{if(workScrollFrame)return;workScrollFrame=requestAnimationFrame(()=>{workScrollFrame=0;workSurface.style.setProperty('--work-scroll',workSurface.scrollTop+'px');});},{passive:true});
function syncWorkAnchor(){workSurface.style.setProperty('--work-scroll',workSurface.scrollTop+'px');}

for(const header of [aboutMenu,darkMenu]){
 header.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>navigate(Number(button.dataset.go))));
}
for(const header of [introMenu,aboutMenu,darkMenu]){
 header.addEventListener('click',event=>{
  const button=event.target.closest('[data-go]');
  if(button&&window.portfolioGalleryOpen){event.stopImmediatePropagation();navigate(Number(button.dataset.go));}
 },true);
}
function navigate(index){if(window.portfolioGalleryOpen)closeGallery(index);else go(index);}
function openGallery(event){
 event?.preventDefault();if(window.portfolioGalleryOpen||galleryReturning)return;
 window.beginDeckTransition?.();
 workAnchor=null;clearTimeout(closingTimer);originState={index:active,scroll:workSurface.scrollTop,focus:document.activeElement};
 window.portfolioGalleryOpen=true;
 document.querySelectorAll('.gallery-close').forEach(b=>{b.inert=false;b.setAttribute('aria-hidden','false');});
 document.body.classList.remove('gallery-closing');document.body.classList.add('gallery-mode');
 window.endDeckTransition?.();document.dispatchEvent(new Event('gallery-mode-change'));workSurface.tabIndex=-1;workSurface.focus({preventScroll:true});
}
function closeGallery(destination){
 if(galleryReturning||!window.portfolioGalleryOpen)return;
 galleryReturning=true;
 if(projectView)closeProject();

 const savedScroll=workSurface.scrollTop;
 workAnchor=null;
 workSurface.style.setProperty('--work-scroll',savedScroll+'px');

 window.beginDeckTransition?.();
 projectRequest++;
 closeDetail();
 window.portfolioGalleryOpen=false;

 document.body.classList.add('gallery-closing');
 document.body.classList.remove('gallery-mode');
 document.querySelectorAll('.gallery-close').forEach(b=>{b.inert=true;b.setAttribute('aria-hidden','true');});

 // Keep the exact gallery scroll position. Do not run an anchor correction after
 // the grid changes back to preview mode: that correction caused the final jerk.
 workSurface.scrollTop=savedScroll;
 workSurface.style.setProperty('--work-scroll',savedScroll+'px');

 if(destination!==undefined&&destination!==originState.index)go(destination);
 else originState.focus?.focus({preventScroll:true});

 window.endDeckTransition?.();
 document.dispatchEvent(new Event('gallery-mode-change'));

 const raw=getComputedStyle(document.documentElement).getPropertyValue('--duration').trim();
 const duration=(reduced.matches?0:(parseFloat(raw)||0)*(raw.endsWith('ms')?1:1000));
 closingTimer=setTimeout(()=>{
  document.body.classList.remove('gallery-closing');
  galleryReturning=false;
  workSurface.scrollTop=savedScroll;
  workSurface.style.setProperty('--work-scroll',savedScroll+'px');
 },Math.max(duration+80,reduced.matches?0:550));
}
document.querySelector('.gallery-launch').addEventListener('click',openGallery);
document.querySelectorAll('.gallery-close').forEach(b=>b.addEventListener('click',()=>projectView?closeProject():closeGallery()));
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&window.portfolioGalleryOpen){if(projectView){event.stopImmediatePropagation();closeProject();}else if(!selected)closeGallery();}},true);
// The menus now live inside INTRO / ABOUT / WORK, so their reveal is created
// by the same physical panels that reveal the page. No independent mask or
// header-position tween is needed.
let motionFrame=0,motionDepth=0,motionFrom=null;
const position=panel=>new DOMMatrixReadOnly(getComputedStyle(panel).transform).m41;
function snapshot(){return {x:panels.map(position)};}
function setMotion(state){panels.forEach((panel,i)=>panel.style.transform=`translate3d(${state.x[i]}px,0,0)`);}
function makeDeckEase(){const values=getComputedStyle(document.documentElement).getPropertyValue('--ease').match(/[.\d]+/g)?.map(Number)||[.22,.61,.36,1];const [x1,y1,x2,y2]=values;const curve=(v,a,b)=>3*(1-v)*(1-v)*v*a+3*(1-v)*v*v*b+v*v*v;return function deckEase(t){let low=0,high=1;for(let i=0;i<16;i++){const middle=(low+high)/2;if(curve(middle,x1,x2)<t)low=middle;else high=middle;}return curve((low+high)/2,y1,y2);};}
window.beginDeckTransition=function(){
 if(motionDepth++>0)return;
 cancelAnimationFrame(motionFrame);
 motionFrom=snapshot();
};
window.endDeckTransition=function(){
 if(--motionDepth>0)return;
 motionDepth=0;
 if(!motionFrom)return;
 const from=motionFrom;
 motionFrom=null;

 panels.forEach(p=>p.style.removeProperty('transform'));
 const to=snapshot();

 const raw=getComputedStyle(document.documentElement).getPropertyValue('--duration').trim();
 const duration=(reduced.matches||window.portfolioRestoring)?0:parseFloat(raw)*(raw.endsWith('ms')?1:1000);

 if(!duration){
  setMotion(to);
  panels.forEach(p=>p.style.removeProperty('transform'));
  syncWorkAnchor();
  return;
 }

 const started=performance.now(),deckEase=makeDeckEase();
 setMotion(from);
 function tick(now){
  const t=Math.min(1,(now-started)/duration),k=deckEase(t);
  setMotion({x:from.x.map((x,i)=>x+(to.x[i]-x)*k)});
  if(t<1)motionFrame=requestAnimationFrame(tick);
  else{
   motionFrame=0;
   panels.forEach(p=>p.style.removeProperty('transform'));
   syncWorkAnchor();
  }
 }
 motionFrame=requestAnimationFrame(tick);
};
window.syncMenu=function(){};
function resizeDeck(){
 cancelAnimationFrame(motionFrame);
 motionFrame=0;
 panels.forEach(p=>p.style.removeProperty('transform'));
 syncWorkAnchor();
}
window.addEventListener('resize',resizeDeck,{passive:true});
window.addEventListener('pageshow',syncWorkAnchor);
window.visualViewport?.addEventListener('resize',syncWorkAnchor,{passive:true});

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
  projectView.append(work?content:document.importNode(content,true));
  projectView.classList.add('is-preparing');
  document.body.append(projectView);
  document.body.classList.add('project-mode');
  workSurface.inert=true;
  document.dispatchEvent(new Event('project-mode-change'));
  requestAnimationFrame(()=>requestAnimationFrame(()=>projectView?.classList.remove('is-preparing')));
  projectView.addEventListener('scroll',()=>toTop.classList.toggle('is-visible',projectView.scrollTop>240),{passive:true});
  projectView.querySelector('.case-back')?.addEventListener('click',e=>{e.preventDefault();closeProject();});
  document.querySelectorAll('.gallery-close').forEach(b=>{b.textContent='BACK';b.setAttribute('aria-label','Close project and return to gallery');});
  document.dispatchEvent(new CustomEvent('analytics-case',{detail:link.dataset.workId||''}));projectView.focus({preventScroll:true});window.translatePage?.(false);
 }catch(error){document.getElementById('announcement').textContent='Could not load the project. Please try again.';}
 finally{link.removeAttribute('aria-busy');}
});

document.addEventListener('portfolio-language',()=>{if(!projectView)return;const work=window.portfolioData?.works.find(w=>w.id===projectView.dataset.workId);if(!work)return;const scroll=projectView.scrollTop;projectView.replaceChildren(window.buildProjectContent(work));projectView.querySelector('.case-back')?.addEventListener('click',e=>{e.preventDefault();closeProject();});projectView.scrollTop=scroll;});
