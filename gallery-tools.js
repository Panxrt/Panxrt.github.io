'use strict';
(function(){
 const grid=document.getElementById('gallery-grid'),entry=grid.closest('.gallery-entry');let category='all';
 const filters=document.createElement('nav');filters.className='gallery-filters';filters.setAttribute('aria-label','Filter projects');const reveal=document.createElement('div');reveal.className='filter-reveal';reveal.append(filters);(document.getElementById('menu-dark')||entry).append(reveal);
 function applyFilter(){const data=window.portfolioData;if(!data)return;closeDetail();const works=data.works.filter(w=>category==='all'||w.categoryIds?.includes(category)),ids=new Set(works.map(w=>w.id));for(const card of grid.children)card.hidden=!ids.has(card.dataset.id);grid._fineWorks=works;MosaicLayout.apply(grid,works);document.dispatchEvent(new Event('gallery-filter-change'));}
 window.getGalleryFilter=()=>category;window.restoreGalleryFilter=value=>{category=value;render();};
 function labels(){const data=window.portfolioData;if(!data)return;const ru=window.portfolioLanguage?.()==='ru';for(const card of grid.children){const w=data.works.find(w=>w.id===card.dataset.id);if(!w)continue;card.querySelector('.work-caption-title').textContent=ru?w.titleRu||w.title:w.title;card.querySelector('.work-caption-description').textContent=ru?w.descriptionRu||w.description:w.description;card.querySelector('.work-caption-more').textContent=ru?'Подробнее +':'Details +';}}
 function render(){const data=window.portfolioData;if(!data)return;if(category!=='all'&&!data.categories?.some(c=>c.id===category))category='all';filters.replaceChildren();const label=document.createElement('span');label.className='filter-label';label.textContent=window.portfolioLanguage?.()==='ru'?'ФИЛЬТРЫ':'FILTERS';filters.append(label);for(const c of [{id:'all',name:'ALL'},...(data.categories||[])]){const b=document.createElement('button');b.textContent=c.name;b.type='button';b.setAttribute('aria-pressed',String(category===c.id));b.onclick=()=>{category=c.id;render();};filters.append(b);}labels();applyFilter();}
 document.addEventListener('portfolio-content',render);document.addEventListener('portfolio-language',labels);if(window.portfolioData)render();

 // Predictive media loading. This does not change layout, filters, hover, blur,
 // animation timing or media styling. It only changes WHEN files are requested.
 const gallerySurface=document.querySelector('.work .surface');
 let warmFrame=0;
 function warmNearbyMedia(){
   warmFrame=0;
   const cards=[...grid.querySelectorAll('.gallery-card:not([hidden])')];
   const top=gallerySurface?.scrollTop||0;
   const height=gallerySurface?.clientHeight||window.innerHeight;
   const preloadEdge=top+height+Math.max(1200,height*1.5);
   for(let i=0;i<cards.length;i++){
     const card=cards[i],media=card.querySelector('img,video');
     if(!media)continue;
     const near=i<10||card.offsetTop<preloadEdge;
     if(!near)continue;
     if(media.tagName==='IMG'){
       if(media.loading!=='eager')media.loading='eager';
       if(i<4)media.fetchPriority='high';
       if(media.complete)media.decode?.().catch(()=>{});
       else if(!media.dataset.decodeQueued){
         media.dataset.decodeQueued='1';
         media.addEventListener('load',()=>media.decode?.().catch(()=>{}),{once:true});
       }
     }else{
       // First rows are allowed to download ahead of time; deeper videos are
       // upgraded from metadata/none only shortly before the user reaches them.
       const desired=i<5?'auto':'metadata';
       if(media.preload!==desired){
         media.preload=desired;
         try{media.load();}catch{}
       }
     }
   }
 }
 function scheduleWarm(){if(!warmFrame)warmFrame=requestAnimationFrame(warmNearbyMedia);}
 gallerySurface?.addEventListener('scroll',scheduleWarm,{passive:true});
 document.addEventListener('portfolio-content',scheduleWarm);
 document.addEventListener('gallery-filter-change',scheduleWarm);
 document.addEventListener('gallery-mode-change',scheduleWarm);
 document.addEventListener('portfolio-startup-complete',scheduleWarm);
 window.addEventListener('resize',scheduleWarm,{passive:true});
 if('requestIdleCallback' in window)requestIdleCallback(scheduleWarm,{timeout:1200});
 else setTimeout(scheduleWarm,350);

 // Decode and play only visible video, prioritising the selected work.
 const visible=new Map();let pending=0;
 const observer=new IntersectionObserver(entries=>{for(const e of entries)visible.set(e.target,e.isIntersecting&&e.intersectionRatio>.05);schedule();},{threshold:[0,.05,.25]});
 function scan(){for(const video of document.querySelectorAll('.gallery-card video,.project-view video'))if(!visible.has(video)){video.autoplay=false;video.removeAttribute('autoplay');video.loop=true;if(!video.preload)video.preload='none';visible.set(video,false);observer.observe(video);}for(const video of visible.keys())if(!video.isConnected){observer.unobserve(video);video.pause();visible.delete(video);}schedule();scheduleWarm();}
 function schedule(){if(!pending)pending=requestAnimationFrame(update);}
 function update(){pending=0;const inCase=!!document.querySelector('.project-view'),workActive=document.body.dataset.page==='2',cap=matchMedia('(max-width:700px)').matches?2:4;let playing=0;const videos=[...visible.keys()].sort((a,b)=>Number(!!b.closest('.selected'))-Number(!!a.closest('.selected')));for(const video of videos){if(video.closest('.media-viewer'))continue;const isCase=!!video.closest('.project-view'),card=video.closest('.gallery-card'),allowed=!window.portfolioMediaOpen&&!document.hidden&&visible.get(video)&&!card?.hidden&&(inCase?isCase:workActive&&!isCase)&&playing<cap;if(allowed){playing++;if(video.paused)video.play().catch(()=>{});}else if(!video.paused)video.pause();}}
 new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['data-page','class']});
 for(const name of ['visibilitychange','portfolio-content','gallery-mode-change','project-mode-change','gallery-filter-change','media-mode-change'])document.addEventListener(name,scan);
 grid.addEventListener('click',schedule);scan();
})();
