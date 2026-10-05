'use strict';
const grid=document.getElementById('gallery-grid'),detail=document.getElementById('project-detail');
let cards=[...grid.querySelectorAll('.gallery-card')];
let selected=null;
const gallerySurface=document.querySelector('.work .surface');
const galleryOrigin=()=>gallerySurface?document.querySelector('.gallery-entry').getBoundingClientRect().top:-window.scrollY;
function placeDetail(){
 if(!selected)return;
 const r=selected.getBoundingClientRect(),margin=14,viewWidth=document.documentElement.clientWidth;
 const width=Math.min(320,viewWidth-32);
 detail.style.width=width+'px';
 let side='bottom',left=Math.max(16,Math.min(r.left,viewWidth-width-16)),top=r.bottom-galleryOrigin()+margin;
 const safeTop=Math.max(document.getElementById('menu-dark')?.getBoundingClientRect().bottom||76,document.querySelector('.gallery-filters')?.getBoundingClientRect().bottom||0)+14;
 if(viewWidth>700&&r.top>=safeTop){
  if(viewWidth-r.right>=width+margin+16){side='right';left=r.right+margin;top=r.top-galleryOrigin();}
  else if(r.left>=width+margin+16){side='left';left=r.left-width-margin;top=r.top-galleryOrigin();}
 }
 top=Math.max(top,safeTop-galleryOrigin());
 detail.dataset.side=side;detail.style.left=left+'px';detail.style.top=top+'px';
}
function closeDetail(returnFocus=false){
 const old=selected;if(old){old.classList.add('caption-dismissed');old.addEventListener('pointerleave',()=>old.classList.remove('caption-dismissed'),{once:true});old.addEventListener('blur',()=>old.classList.remove('caption-dismissed'),{once:true,capture:true});}grid.querySelectorAll('video').forEach(v=>v.muted=true);selected=null;detail.hidden=true;grid.classList.remove('has-selection');
 cards.forEach(card=>{card.classList.remove('selected');card.querySelector('button').setAttribute('aria-expanded','false');});
 if(returnFocus&&old)old.querySelector('button').focus({preventScroll:true});
}
function selectCard(card){
 if(gallerySurface&&!window.portfolioGalleryOpen)return;
 if(selected===card){closeDetail();return;}
 grid.querySelectorAll('video').forEach(v=>v.muted=true);const video=card.querySelector('video');if(video){video.muted=false;video.loop=true;video.play().catch(()=>{video.muted=true;});}selected=card;grid.classList.add('has-selection');
 cards.forEach(item=>{item.classList.toggle('selected',item===card);item.querySelector('button').setAttribute('aria-expanded',String(item===card));});
 const work=window.portfolioData?.works.find(w=>w.id===card.dataset.id),ru=window.portfolioLanguage?.()==='ru';
 document.getElementById('detail-title').textContent=work?(ru?work.titleRu||work.title:work.title):card.dataset.title;
 document.getElementById('detail-type').textContent=work?(ru?work.typeRu||work.type:work.type):card.dataset.type;
 document.getElementById('detail-description').textContent=work?(ru?work.descriptionRu||work.description:work.description):'Project description will be added here.';
 document.getElementById('case-link').href='case-'+card.dataset.id+'.html';
 document.getElementById('case-link').dataset.workId=card.dataset.id;document.getElementById('case-link').hidden=work?.showFullProject===false;
 if(window.openMediaViewer?.(card,work)){detail.hidden=true;return;}
 detail.hidden=false;window.translatePage?.(false);placeDetail();
 // Restart the drawer entrance when switching between works.
 detail.style.animation='none';void detail.offsetWidth;detail.style.animation='';
 detail.querySelector('button').focus({preventScroll:true});
 const box=detail.getBoundingClientRect();
 if(box.bottom>window.innerHeight-16&&detail.dataset.side==='bottom'){
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  (gallerySurface||window).scrollBy({top:Math.min(box.bottom-window.innerHeight+24,box.top-115),behavior:reduced?'auto':'smooth'});
 }
}
grid.addEventListener('click',event=>{const card=event.target.closest('.gallery-card');if(card){const opening=selected!==card;selectCard(card);if(opening)document.dispatchEvent(new CustomEvent('analytics-work',{detail:card.dataset.id}));}});
document.addEventListener('portfolio-content',()=>{closeDetail();cards=[...grid.querySelectorAll('.gallery-card')];});
document.addEventListener('portfolio-language',()=>{if(selected){const card=selected;selected=null;selectCard(card);}});
detail.querySelector('button').addEventListener('click',()=>closeDetail(true));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&selected){event.preventDefault();closeDetail(true);}});
document.addEventListener('click',event=>{if(selected&&!window.portfolioMediaOpen&&!event.target.closest('.gallery-card')&&!detail.contains(event.target))closeDetail();});
window.addEventListener('resize',placeDetail);

if(gallerySurface)gallerySurface.addEventListener('scroll',placeDetail,{passive:true});

