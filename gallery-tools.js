'use strict';
(function(){
 const grid=document.getElementById('gallery-grid'),entry=grid.closest('.gallery-entry');let category='all';
 const filters=document.createElement('nav');filters.className='submenu-controls';filters.setAttribute('aria-label','Filter projects');
 const submenuMask=document.createElement('div');submenuMask.className='submenu-mask';
 const submenuSheet=document.createElement('div');submenuSheet.className='submenu-sheet';
 const submenuGlass=document.createElement('div');submenuGlass.className='submenu-glass';
 submenuSheet.append(submenuGlass,filters);submenuMask.append(submenuSheet);
 submenuMask.classList.add('submenu-overlay');
 document.body.append(submenuMask);
 function applyFilter(){const data=window.portfolioData;if(!data)return;closeDetail();const works=data.works.filter(w=>category==='all'||w.categoryIds?.includes(category)),ids=new Set(works.map(w=>w.id));for(const card of grid.children)card.hidden=!ids.has(card.dataset.id);grid._fineWorks=works;MosaicLayout.apply(grid,works);document.dispatchEvent(new Event('gallery-filter-change'));}
 window.getGalleryFilter=()=>category;window.restoreGalleryFilter=value=>{category=value;render();};
 function labels(){const data=window.portfolioData;if(!data)return;const ru=window.portfolioLanguage?.()==='ru';for(const card of grid.children){const w=data.works.find(w=>w.id===card.dataset.id);if(!w)continue;card.querySelector('.work-caption-title').textContent=ru?w.titleRu||w.title:w.title;card.querySelector('.work-caption-description').textContent=ru?w.descriptionRu||w.description:w.description;card.querySelector('.work-caption-more').textContent=ru?'Подробнее +':'Details +';}}
 function render(){const data=window.portfolioData;if(!data)return;if(category!=='all'&&!data.categories?.some(c=>c.id===category))category='all';filters.replaceChildren();const label=document.createElement('span');label.className='filter-label';label.textContent=window.portfolioLanguage?.()==='ru'?'ФИЛЬТРЫ':'FILTERS';filters.append(label);for(const c of [{id:'all',name:'ALL'},...(data.categories||[])]){const b=document.createElement('button');b.textContent=c.name;b.type='button';b.setAttribute('aria-pressed',String(category===c.id));b.onclick=()=>{category=c.id;render();};filters.append(b);}labels();applyFilter();}
 document.addEventListener('portfolio-content',render);document.addEventListener('portfolio-language',labels);if(window.portfolioData)render();

 // Performance-safe media loading.
 // Scroll itself stays 100% native: no synthetic scrollTop animation.
 const gallerySurface=document.querySelector('.work .surface');

 let galleryScrolling=false,scrollStopTimer=0;
 let pending=0;
 let workPreviewReady=false,workPreviewTimer=0,lastWorkActive=document.body.dataset.page==='2';

 function deckDurationMs(){
  const raw=getComputedStyle(document.documentElement).getPropertyValue('--duration').trim();
  const n=parseFloat(raw)||0;
  return n*(raw.endsWith('ms')?1:1000);
 }

 function armWorkPreview(){
  clearTimeout(workPreviewTimer);
  workPreviewReady=false;
  schedule();
  if(document.body.dataset.page!=='2')return;
  workPreviewTimer=setTimeout(()=>{
   if(document.body.dataset.page==='2'){
    workPreviewReady=true;
    schedule();
    scheduleWarm(40);
   }
  },Math.max(120,deckDurationMs()+70));
 }

 const visible=new Map();
 const warmQueue=new Set();
 let warmTimer=0,warmIdle=0;

 function isGalleryTransitioning(){
   return document.body.classList.contains('gallery-transitioning');
 }

 function queueWarm(card){
   if(card)warmQueue.add(card);
 }

 function processWarmQueue(){
   warmIdle=0;
   if(galleryScrolling||isGalleryTransitioning()){
     scheduleWarm(180);
     return;
   }

   const cards=[...warmQueue];
   warmQueue.clear();

   for(const card of cards){
     if(!card.isConnected||card.hidden)continue;
     const media=card.querySelector('img,video');
     if(!media)continue;

     if(media.tagName==='IMG'){
       if(media.loading!=='eager')media.loading='eager';
       if(media.complete)media.decode?.().catch(()=>{});
       else if(!media.dataset.decodeQueued){
         media.dataset.decodeQueued='1';
         media.addEventListener('load',()=>media.decode?.().catch(()=>{}),{once:true});
       }
     }else{
       // Do not force large video downloads while the user is moving.
       // Metadata is enough for nearby cards; play() can request the actual
       // stream after scrolling/transitioning has stopped.
       if(media.preload!=='metadata')media.preload='metadata';
     }
   }
 }

 function scheduleWarm(delay=90){
   clearTimeout(warmTimer);
   warmTimer=setTimeout(()=>{
     if('requestIdleCallback' in window){
       if(warmIdle)cancelIdleCallback(warmIdle);
       warmIdle=requestIdleCallback(processWarmQueue,{timeout:700});
     }else{
       processWarmQueue();
     }
   },delay);
 }

 const warmObserver=new IntersectionObserver(entries=>{
   for(const e of entries){
     if(e.isIntersecting)queueWarm(e.target);
   }
   if(warmQueue.size)scheduleWarm(galleryScrolling?180:90);
 },{
   root:gallerySurface,
   rootMargin:'1100px 0px 1100px 0px',
   threshold:0
 });

 function observeWarmTargets(){
   for(const card of grid.querySelectorAll('.gallery-card')){
     if(card.dataset.warmObserved)continue;
     card.dataset.warmObserved='1';
     warmObserver.observe(card);
   }
 }

 const observer=new IntersectionObserver(entries=>{
   for(const e of entries)visible.set(e.target,e.isIntersecting&&e.intersectionRatio>.05);
   schedule();
 },{root:gallerySurface,threshold:[0,.05,.25]});

 function scan(){
   observeWarmTargets();

   for(const video of document.querySelectorAll('.gallery-card video,.project-view video')){
     if(visible.has(video))continue;
     video.autoplay=false;
     video.removeAttribute('autoplay');
     video.loop=true;
     if(!video.preload)video.preload='none';
     visible.set(video,false);
     observer.observe(video);
   }

   for(const video of [...visible.keys()]){
     if(video.isConnected)continue;
     observer.unobserve(video);
     video.pause();
     visible.delete(video);
   }

   schedule();
 }

 function schedule(){
   if(!pending)pending=requestAnimationFrame(update);
 }

 function update(){
   pending=0;
   const inCase=!!document.querySelector('.project-view');
   const workActive=document.body.dataset.page==='2';
   const mobile=matchMedia('(max-width:700px)').matches;
   const cap=mobile?1:2;
   let playing=0;

   const videos=[...visible.keys()].sort(
     (a,b)=>Number(!!b.closest('.selected'))-Number(!!a.closest('.selected'))
   );

   for(const video of videos){
     if(video.closest('.media-viewer'))continue;

     const isCase=!!video.closest('.project-view');
     const card=video.closest('.gallery-card');

     // Gallery videos do not start/resume while the scroll or the gallery/page
     // transition is active. This keeps the compositor free for movement.
     const movementBusy=galleryScrolling||isGalleryTransitioning();
     // Preview videos are allowed on the normal WORK page too, but only after
     // the page transition has settled. IntersectionObserver still limits this
     // to videos actually visible in the WORK viewport.
     const workPlayback=workActive&&!isCase&&(window.portfolioGalleryOpen||workPreviewReady);

     const allowed=
       !window.portfolioMediaOpen&&
       !document.hidden&&
       !movementBusy&&
       visible.get(video)&&
       !card?.hidden&&
       (inCase?isCase:workPlayback)&&
       playing<cap;

     if(allowed){
       playing++;
       if(video.paused)video.play().catch(()=>{});
     }else if(!video.paused){
       video.pause();
     }
   }
 }

 gallerySurface?.addEventListener('scroll',()=>{
   if(!window.portfolioGalleryOpen)return;

   if(!galleryScrolling){
     galleryScrolling=true;
     schedule(); // pause running gallery videos once, immediately
   }

   clearTimeout(scrollStopTimer);
   scrollStopTimer=setTimeout(()=>{
     galleryScrolling=false;
     schedule();       // resume only the nearest 1/2 visible videos
     scheduleWarm(70); // warm nearby media after motion has stopped
   },150);
 },{passive:true});

 new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
 new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['data-page','class']});
 new MutationObserver(()=>{
   const now=document.body.dataset.page==='2';
   if(now===lastWorkActive)return;
   lastWorkActive=now;
   armWorkPreview();
 }).observe(document.body,{attributes:true,attributeFilter:['data-page']});

 document.addEventListener('portfolio-startup-complete',armWorkPreview);

 for(const name of ['visibilitychange','portfolio-content','gallery-mode-change','project-mode-change','gallery-filter-change','media-mode-change']){
   document.addEventListener(name,()=>{
     scan();
     // gallery-mode-change fires at the START of the transition; delay warming
     // until the 820ms visual motion has finished.
     if(name==='gallery-mode-change')scheduleWarm(900);
     else scheduleWarm(90);
   });
 }

 grid.addEventListener('click',schedule);
 window.addEventListener('resize',()=>scheduleWarm(120),{passive:true});

 scan();
 scheduleWarm(250);
 if(!document.documentElement.classList.contains('site-booting')&&document.body.dataset.page==='2')armWorkPreview();
})();
