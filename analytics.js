(function(){
 const key='panxrt-visit';let state;try{state=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
 if(!state||Date.now()-state.last>1800000)state={id:crypto.randomUUID(),last:Date.now(),elapsed:0};
 let disabled=false,lastTick=Date.now(),lastBeat=0;const seen=new Set(),visible=new Map();
 const excluded=()=>disabled||/(?:^|;\s*)panxrt_no_stats=1(?:;|$)/.test(document.cookie);
 function persist(){try{sessionStorage.setItem(key,JSON.stringify(state));}catch{}}
 function send(kind,item=''){if(excluded())return;if(Date.now()-state.last>1800000){state={id:crypto.randomUUID(),last:Date.now(),elapsed:0};seen.clear();}state.last=Date.now();persist();const payload=JSON.stringify({id:crypto.randomUUID(),session:state.id,kind,item,elapsed:Math.floor(state.elapsed)});fetch('/api/analytics/event',{method:'POST',headers:{'Content-Type':'application/json'},body:payload,keepalive:true}).then(r=>r.status===200?r.json():null).then(d=>{if(d?.excluded)disabled=true;}).catch(()=>{});}
 const once=(kind,item='')=>{const k=kind+':'+item;if(!seen.has(k)){seen.add(k);send(kind,item);}};
 once('visit');let page=document.body.dataset.page||'0';const names=['intro','about','work','contacts'];once('section',names[Number(page)]||'intro');
 new MutationObserver(()=>{const p=document.body.dataset.page;if(p!==page){page=p;send('section',names[Number(p)]||'intro');}}).observe(document.body,{attributes:true,attributeFilter:['data-page']});
 document.addEventListener('gallery-mode-change',()=>{if(window.portfolioGalleryOpen){send('gallery');for(const node of visible.keys())visible.set(node,Date.now());}});
 document.addEventListener('analytics-work',e=>send('work',e.detail));document.addEventListener('analytics-case',e=>send('case',e.detail));
 const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting&&e.intersectionRatio>=.5)visible.set(e.target,Date.now());else visible.delete(e.target);}},{threshold:[0,.5]});
 const observe=()=>{observer.disconnect();visible.clear();document.querySelectorAll('.gallery-card').forEach(n=>observer.observe(n));};document.addEventListener('portfolio-content',observe);document.addEventListener('gallery-filter-change',observe);observe();
 setInterval(()=>{const now=Date.now(),delta=Math.min(2,(now-lastTick)/1000);lastTick=now;if(document.hidden)return;state.elapsed+=delta;persist();if(window.portfolioGalleryOpen&&!document.querySelector('.project-view'))for(const [node,since]of visible)if(!node.hidden&&now-since>=1000)once('impression',node.dataset.id);if(now-lastBeat>=15000){lastBeat=now;send('heartbeat');}},1000);
 document.addEventListener('visibilitychange',()=>{lastTick=Date.now();if(document.hidden)send('heartbeat');});window.addEventListener('pagehide',()=>send('heartbeat'));
})();
