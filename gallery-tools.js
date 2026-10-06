'use strict';
(function(){
 const grid=document.getElementById('gallery-grid'),entry=grid.closest('.gallery-entry');
 const gallerySurface=document.querySelector('.work .surface');
 let category='all';
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
 function chooseCategory(next){
  if(next===category)return;
  category=next;
  render();

  // A filtered gallery is a new result set: always present it from the top.
  // Native smooth scrolling keeps this motion cheap and avoids a custom RAF loop.
  requestAnimationFrame(()=>{
   gallerySurface?.scrollTo({
    top:0,
    left:0,
    behavior:reduced.matches?'auto':'smooth'
   });
  });
 }
 function render(){const data=window.portfolioData;if(!data)return;if(category!=='all'&&!data.categories?.some(c=>c.id===category))category='all';filters.replaceChildren();const label=document.createElement('span');label.className='filter-label';label.textContent=window.portfolioLanguage?.()==='ru'?'ФИЛЬТРЫ':'FILTERS';filters.append(label);for(const c of [{id:'all',name:'ALL'},...(data.categories||[])]){const b=document.createElement('button');b.textContent=c.name;b.type='button';b.setAttribute('aria-pressed',String(category===c.id));b.onclick=()=>chooseCategory(c.id);filters.append(b);}labels();applyFilter();}
 document.addEventListener('portfolio-content',render);document.addEventListener('portfolio-language',labels);if(window.portfolioData)render();

 // Performance-safe media loading.
 // Scroll itself stays 100% native: no synthetic scrollTop animation.

 let galleryScrolling=false,scrollStopTimer=0;
 let pending=0;
 let workSettled=false,workSettleTimer=0,lastWorkPage=document.body.dataset.page==='2';
 function deckDuration(){const raw=getComputedStyle(document.documentElement).getPropertyValue('--duration').trim();const n=parseFloat(raw)||0;return n*(raw.endsWith('ms')?1:1000);}
 function armWorkPlayback(){
  clearTimeout(workSettleTimer);workSettled=false;schedule();
  if(document.body.dataset.page!=='2')return;
  workSettleTimer=setTimeout(()=>{if(document.body.dataset.page==='2'){workSettled=true;scan();schedule();scheduleWarm(40);}},Math.max(160,deckDuration()+80));
 }
 function inWorkViewport(video){
  const r=video.getBoundingClientRect(),s=gallerySurface?.getBoundingClientRect();
  const top=Math.max(0,s?.top||0),bottom=Math.min(innerHeight,s?.bottom||innerHeight);
  return r.bottom>top&&r.top<bottom&&r.right>0&&r.left<innerWidth;
 }
 const visible=new Map();
 const viewportVisible=new Map();
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

 // Real SCREEN visibility. Unlike the gallery-surface observer, this follows
 // videos while the whole WORK panel itself is sliding between pages.
 // The browser performs the intersection tracking natively, so we do not add
 // layout reads to every deck animation frame.
 const viewportObserver=new IntersectionObserver(entries=>{
   for(const e of entries){
     viewportVisible.set(e.target,e.isIntersecting&&e.intersectionRatio>.01);
   }
   schedule();
 },{root:null,threshold:[0,.01,.1,.25]});

 function scan(){
   observeWarmTargets();

   for(const video of document.querySelectorAll('.gallery-card video,.project-view video')){
     if(visible.has(video))continue;
     video.autoplay=false;
     video.removeAttribute('autoplay');
     video.loop=true;
     if(!video.preload)video.preload='none';
     visible.set(video,false);
     viewportVisible.set(video,false);
     observer.observe(video);
     viewportObserver.observe(video);
   }

   for(const video of [...visible.keys()]){
     if(video.isConnected)continue;
     observer.unobserve(video);
     viewportObserver.unobserve(video);
     video.pause();
     visible.delete(video);
     viewportVisible.delete(video);
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

   const deckMoving=document.body.classList.contains('deck-motion-active');

   const videos=[...visible.keys()].sort((a,b)=>{
     if(deckMoving){
       const screenDelta=Number(!!viewportVisible.get(b))-Number(!!viewportVisible.get(a));
       if(screenDelta)return screenDelta;
     }
     return Number(!!b.closest('.selected'))-Number(!!a.closest('.selected'));
   });

   for(const video of videos){
     if(video.closest('.media-viewer'))continue;

     const isCase=!!video.closest('.project-view');
     const card=video.closest('.gallery-card');

     // V47:
     // - scrolling still pauses gallery videos;
     // - gallery OPEN/BACK choreography still pauses them to protect that effect;
     // - normal PAGE sliding keeps only videos that are actually inside the
     //   browser viewport running;
     // - Gallery -> CONTACTS is the one gallery-closing state that is also a
     //   page slide, so viewport-visible videos keep playing there too.
     const leavingGalleryToContacts=document.body.classList.contains('gallery-to-contacts');
     const internalGalleryMotion=isGalleryTransitioning()&&!leavingGalleryToContacts;
     const deckViewportPlayback=deckMoving&&!internalGalleryMotion;
     const movementBusy=galleryScrolling||internalGalleryMotion;

     const visibleNow=deckViewportPlayback
       ? !!viewportVisible.get(video)
       : (window.portfolioGalleryOpen
          ? !!visible.get(video)
          : (workActive&&workSettled&&inWorkViewport(video)));

     const workPlayback=!isCase&&(
       (workActive&&(window.portfolioGalleryOpen||workSettled))||
       deckViewportPlayback
     );

     const allowed=
       !window.portfolioMediaOpen&&
       !document.hidden&&
       !movementBusy&&
       visibleNow&&
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
   if(now===lastWorkPage)return;
   lastWorkPage=now;armWorkPlayback();
 }).observe(document.body,{attributes:true,attributeFilter:['data-page']});
 document.addEventListener('portfolio-startup-complete',armWorkPlayback);

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
 if(document.body.dataset.page==='2')armWorkPlayback();
})();
