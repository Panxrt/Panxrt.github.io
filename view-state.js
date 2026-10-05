(function(){
 const key='panxrt-view-v1',surface=document.querySelector('.work .surface');
 if('scrollRestoration' in history)history.scrollRestoration='manual';
 function save(){if(window.portfolioRestoring)return;const edge=surface.getBoundingClientRect().top+80,card=[...document.querySelectorAll('.gallery-card')].find(n=>!n.hidden&&n.getBoundingClientRect().bottom>edge);try{sessionStorage.setItem(key,JSON.stringify({page:Number(document.body.dataset.page)||0,gallery:!!window.portfolioGalleryOpen,filter:window.getGalleryFilter?.()||'all',scroll:surface.scrollTop,anchor:card?{id:card.dataset.id,top:card.getBoundingClientRect().top}:null,viewer:window.getPortfolioViewerState?.()}));}catch{}}
 window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
 let saved;try{if(performance.getEntriesByType('navigation')[0]?.type==='reload')saved=JSON.parse(sessionStorage.getItem(key));}catch{}
 if(!saved)return;
 const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
 window.portfolioRestore=(async()=>{
  window.portfolioRestoring=true;
  try{
   if(!window.portfolioData)await Promise.race([new Promise(resolve=>document.addEventListener('portfolio-content',resolve,{once:true})),new Promise(resolve=>setTimeout(resolve,2200))]);
   if(!window.portfolioData)return;
   go(saved.gallery?2:Math.max(0,Math.min(3,saved.page)));
   if(saved.gallery){openGallery();window.restoreGalleryFilter?.(saved.filter);}
   await frame();await frame();surface.scrollTop=saved.scroll||0;
   const anchor=saved.anchor&&[...document.querySelectorAll('.gallery-card')].find(n=>n.dataset.id===saved.anchor.id);
   if(anchor&&!anchor.hidden)surface.scrollTop+=anchor.getBoundingClientRect().top-saved.anchor.top;
   if(saved.viewer&&saved.gallery){const card=[...document.querySelectorAll('.gallery-card')].find(n=>n.dataset.id===saved.viewer.id);if(card&&!card.hidden){const media=card.querySelector('img,video');if(media&&!(media.complete||media.readyState>=1)){await Promise.race([new Promise(resolve=>{media.addEventListener(media.tagName==='VIDEO'?'loadedmetadata':'load',resolve,{once:true});media.addEventListener('error',resolve,{once:true});if(media.tagName==='VIDEO'){media.preload='metadata';media.load();}}),new Promise(resolve=>setTimeout(resolve,900))]);}selectCard(card);await frame();window.restoreCaseScroll?.(saved.viewer.caseScroll||0);}}
  }finally{window.portfolioRestoring=false;}
 })();
})();
