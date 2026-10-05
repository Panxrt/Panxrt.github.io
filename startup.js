(function(){
 const root=document.documentElement,loader=document.getElementById('site-loader'),word=loader.querySelector('.loader-word'),started=performance.now();
 let done=false;
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const readyImage=img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});});
 const contentReady=new Promise(resolve=>document.addEventListener('portfolio-content',resolve,{once:true}));
 const fontsReady=document.fonts?.ready||Promise.resolve();
 const block=e=>{if(root.classList.contains('site-booting')){if(e.cancelable)e.preventDefault();e.stopImmediatePropagation();}};
 for(const type of ['wheel','touchstart','touchmove','keydown'])window.addEventListener(type,block,{capture:true,passive:false});
 async function reveal(){
  if(done)return;done=true;clearTimeout(window.bootDeadline);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  await wait(Math.max(0,(reduced?0:850)-(performance.now()-started)));
  if(window.portfolioRestore)await window.portfolioRestore;
  const target=document.querySelector('#menu .wordmark'),from=word.getBoundingClientRect(),to=target?.getBoundingClientRect();
  root.classList.add('site-arriving');root.classList.remove('site-booting');loader.style.display='flex';loader.style.pointerEvents='none';loader.style.background='transparent';if(!reduced)loader.animate([{backgroundColor:'#FAF4E6'},{backgroundColor:'transparent'}],{duration:650,easing:'ease'});
  if(!reduced&&to){
   word.style.cssText+=';position:fixed;left:'+from.left+'px;top:'+from.top+'px;width:'+from.width+'px;height:'+from.height+'px';
   const motion=word.animate([{transform:'translate(0,0) scale(1,1)'},{transform:`translate(${to.left-from.left}px,${to.top-from.top}px) scale(${to.width/from.width},${to.height/from.height})`}],{duration:750,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'});
   await motion.finished.catch(()=>{});
  }
  loader.remove();root.classList.remove('site-arriving');
  for(const type of ['wheel','touchstart','touchmove','keydown'])window.removeEventListener(type,block,true);
 }
 Promise.race([Promise.all([contentReady,fontsReady]).then(()=>Promise.race([Promise.all([...document.querySelectorAll('.brand-track img')].map(readyImage)),wait(600)])),wait(2600)]).then(reveal);
})();
