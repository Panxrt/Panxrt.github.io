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
   // Keep the established V36 startup duration.
   await wait(Math.max(0,(reduced?0:1250)-(performance.now()-started)));
   if(window.portfolioRestore)await window.portfolioRestore;

   root.classList.add('site-arriving');root.classList.remove('site-booting');
   loader.style.display='flex';loader.style.pointerEvents='none';loader.style.background='transparent';

   // Let the final header geometry settle BEFORE measuring the destination.
   // This removes the tiny correction/jump that used to happen near the end.
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));

   const target=document.querySelector('#menu .wordmark');
   const from=word.getBoundingClientRect(),to=target?.getBoundingClientRect();

   if(!reduced)loader.animate(
     [{backgroundColor:'#FAF4E6'},{backgroundColor:'transparent'}],
     {duration:800,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'}
   );

   let targetFade=null;
   if(!reduced&&to&&target){
     word.style.cssText+=';position:fixed;left:'+from.left+'px;top:'+from.top+'px;width:'+from.width+'px;height:'+from.height+'px;will-change:transform,opacity;backface-visibility:hidden;transform-origin:0 0';
     const dx=to.left-from.left,dy=to.top-from.top,sx=to.width/from.width,sy=to.height/from.height;

     // Cross-fade only at the very end: the moving loader word and the real
     // menu word occupy the same geometry, so there is no visible swap/blink.
     targetFade=target.animate(
       [{opacity:0},{opacity:1}],
       {duration:160,delay:660,easing:'ease-out',fill:'forwards'}
     );
     const motion=word.animate(
       [
         {transform:'translate3d(0,0,0) scale(1,1)',opacity:1,offset:0},
         {transform:`translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`,opacity:1,offset:.80},
         {transform:`translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`,opacity:0,offset:1}
       ],
       {duration:820,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'}
     );
     await Promise.all([
       motion.finished.catch(()=>{}),
       targetFade.finished.catch(()=>{})
     ]);
   }

   // Reveal the real header first while its opacity animation is held at 1,
   // then remove the loader. This prevents the one-frame flash seen in V36.
   root.classList.remove('site-arriving');
   await new Promise(resolve=>requestAnimationFrame(resolve));
   loader.remove();
   targetFade?.cancel();

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