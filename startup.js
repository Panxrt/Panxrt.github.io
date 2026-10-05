(function(){
 const root=document.documentElement,loader=document.getElementById('site-loader'),word=loader?.querySelector('.loader-word'),started=performance.now();
 if(!loader||!word)return;
 let done=false;
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const readyImage=img=>img.complete?Promise.resolve():new Promise(resolve=>{
   img.addEventListener('load',resolve,{once:true});
   img.addEventListener('error',resolve,{once:true});
 });
 const contentReady=new Promise(resolve=>{
   if(window.portfolioData)resolve();
   else document.addEventListener('portfolio-content',resolve,{once:true});
 });
 const fontsReady=document.fonts?.ready||Promise.resolve();
 const block=e=>{if(root.classList.contains('site-booting')){if(e.cancelable)e.preventDefault();e.stopImmediatePropagation();}};
 for(const type of ['wheel','touchstart','touchmove','keydown'])window.addEventListener(type,block,{capture:true,passive:false});

 function warmTopOfWork(){
   const cards=[...document.querySelectorAll('#gallery-grid .gallery-card')].slice(0,10);
   const imagePromises=[];
   cards.forEach((card,index)=>{
     const media=card.querySelector('img,video');
     if(!media)return;
     if(media.tagName==='IMG'){
       media.loading='eager';
       if(index<4)media.fetchPriority='high';
       const ready=readyImage(media).then(()=>media.decode?.().catch(()=>{}));
       if(index<6)imagePromises.push(ready);
     }else{
       // Keep startup lightweight: metadata is enough during the PANXRT handoff.
       // gallery-tools upgrades nearby videos after the site is already visible.
       media.preload='metadata';
     }
   });
   // Never let a slow image/network hold the intro hostage.
   return Promise.race([Promise.allSettled(imagePromises),wait(850)]);
 }

 async function reveal(){
   if(done)return;done=true;clearTimeout(window.bootDeadline);
   const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   // Slightly longer branded intro gives the browser time to prepare WORK,
   // but it still has a hard cap and never waits for the whole portfolio.
   await wait(Math.max(0,(reduced?0:1250)-(performance.now()-started)));
   if(window.portfolioRestore)await window.portfolioRestore;
   const target=document.querySelector('#menu .wordmark'),from=word.getBoundingClientRect(),to=target?.getBoundingClientRect();
   root.classList.add('site-arriving');root.classList.remove('site-booting');
   loader.style.display='flex';loader.style.pointerEvents='none';loader.style.background='transparent';
   if(!reduced)loader.animate([{backgroundColor:'#FAF4E6'},{backgroundColor:'transparent'}],{duration:800,easing:'cubic-bezier(.22,.61,.36,1)'});
   if(!reduced&&to){
     word.style.cssText+=';position:fixed;left:'+from.left+'px;top:'+from.top+'px;width:'+from.width+'px;height:'+from.height+'px';
     const motion=word.animate(
       [{transform:'translate(0,0) scale(1,1)',opacity:1},{transform:`translate(${to.left-from.left}px,${to.top-from.top}px) scale(${to.width/from.width},${to.height/from.height})`,opacity:1}],
       {duration:820,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'}
     );
     await motion.finished.catch(()=>{});
   }
   loader.remove();
   // Give the compositor one clean frame with the final header geometry before
   // the section reveal animations resume.
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   root.classList.remove('site-arriving');
   for(const type of ['wheel','touchstart','touchmove','keydown'])window.removeEventListener(type,block,true);
   document.dispatchEvent(new Event('portfolio-startup-complete'));
 }

 const prepare=Promise.all([contentReady,fontsReady]).then(async()=>{
   const brands=[...document.querySelectorAll('.brand-track img')];
   await Promise.all([
     Promise.race([Promise.all(brands.map(readyImage)),wait(500)]),
     warmTopOfWork()
   ]);
 });

 Promise.race([prepare,wait(3200)]).then(reveal);
})();