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

   await wait(Math.max(0,(reduced?0:1250)-(performance.now()-started)));
   if(window.portfolioRestore)await window.portfolioRestore;

   root.classList.add('site-arriving');
   root.classList.remove('site-booting');
   loader.style.display='flex';
   loader.style.pointerEvents='none';
   loader.style.background='transparent';

   // Wait until the REAL final header has settled, then measure it.
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));

   const target=document.querySelector('#menu .wordmark');
   const from=word.getBoundingClientRect();
   const to=target?.getBoundingClientRect();

   if(!reduced){
     loader.animate(
       [{backgroundColor:'#FAF4E6'},{backgroundColor:'transparent'}],
       {duration:800,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'}
     );
   }

   let handoff=null;

   if(!reduced&&target&&to){
     const cs=getComputedStyle(target);

     // Use the real menu wordmark's typography for the moving handoff.
     // At the end it is pixel-aligned with the actual target.
     handoff=document.createElement('div');
     handoff.textContent=target.textContent;
     handoff.setAttribute('aria-hidden','true');

     Object.assign(handoff.style,{
       position:'fixed',
       left:to.left+'px',
       top:to.top+'px',
       width:to.width+'px',
       height:to.height+'px',
       zIndex:'10001',
       pointerEvents:'none',
       margin:'0',
       padding:'0',
       border:'0',
       background:'transparent',
       color:cs.color,
       fontFamily:cs.fontFamily,
       fontSize:cs.fontSize,
       fontWeight:cs.fontWeight,
       fontStyle:cs.fontStyle,
       lineHeight:cs.lineHeight,
       letterSpacing:cs.letterSpacing,
       whiteSpace:'nowrap',
       display:'flex',
       alignItems:'center',
       justifyContent:'flex-start',
       transformOrigin:'0 0',
       willChange:'transform,opacity',
       backfaceVisibility:'hidden'
     });

     document.body.append(handoff);

     const dx=from.left-to.left;
     const dy=from.top-to.top;
     const sx=from.width/to.width;
     const sy=from.height/to.height;

     // Briefly hand the already-visible loader word to the exact menu-shaped
     // clone, then move only that clone to the final position.
     handoff.style.transform=`translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`;
     handoff.style.opacity='0';

     const swapIn=handoff.animate(
       [{opacity:0},{opacity:1}],
       {duration:90,easing:'ease-out',fill:'forwards'}
     );
     const swapOut=word.animate(
       [{opacity:1},{opacity:0}],
       {duration:90,easing:'ease-out',fill:'forwards'}
     );

     await Promise.all([swapIn.finished.catch(()=>{}),swapOut.finished.catch(()=>{})]);

     const motion=handoff.animate(
       [
         {transform:`translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`},
         {transform:'translate3d(0,0,0) scale(1,1)'}
       ],
       {duration:760,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'}
     );

     await motion.finished.catch(()=>{});

     // Reveal the real target UNDER an identical, already aligned copy.
     // Remove the copy one frame later: there is no visible replacement flash.
     root.classList.add('site-ui-reveal');
     root.classList.remove('site-arriving');
     await new Promise(resolve=>requestAnimationFrame(resolve));
     handoff.remove();
   }else{
     root.classList.add('site-ui-reveal');
     root.classList.remove('site-arriving');
   }

   loader.remove();
   setTimeout(()=>root.classList.remove('site-ui-reveal'),1400);

   for(const type of ['wheel','touchstart','touchmove','keydown']){
     window.removeEventListener(type,block,true);
   }
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