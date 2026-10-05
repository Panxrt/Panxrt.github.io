'use strict';
(function(){
 const viewer=document.createElement('dialog');viewer.className='media-viewer';viewer.setAttribute('aria-labelledby','viewer-title');
 viewer.innerHTML='<div class="viewer-shade" aria-hidden="true"></div><div class="viewer-stage"></div><div class="viewer-description"><h2 id="viewer-title"></h2><p class="viewer-type"></p><p class="viewer-copy"></p><div class="viewer-actions"><button type="button" class="viewer-close">BACK</button></div></div>';
 document.body.append(viewer);
 const stage=viewer.querySelector('.viewer-stage'),description=viewer.querySelector('.viewer-description'),shade=viewer.querySelector('.viewer-shade'),back=viewer.querySelector('.viewer-close');
 let state=null,frame=null,animation=null,closing=null,sheet=null,caseObserver=null,generation=0;
 const reduced=()=>window.portfolioRestoring||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const touch=()=>matchMedia('(hover: none) and (pointer: coarse)').matches;
 const rectStyle=r=>({left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
 function mobileControls(video){
  video.controls=!touch();if(!touch())return ()=>{};
  const show=e=>{if(video.controls)return;e.preventDefault();e.stopPropagation();video.controls=true;};
  video.addEventListener('click',show);return ()=>video.removeEventListener('click',show);
 }
 function finish(){
  if(!state)return;const old=state;state=null;generation++;
  animation?.cancel();animation=null;caseObserver?.disconnect();caseObserver=null;sheet?.remove();sheet=null;viewer.classList.remove('has-case');
  old.cleanup?.();old.media.style.cssText=old.style;old.media.controls=old.controls;if(old.media.tagName==='VIDEO')old.media.muted=true;
  old.placeholder.replaceWith(old.media);frame?.remove();frame=null;
  document.body.classList.remove('media-open');closeDetail();old.surface.scrollTop=old.scroll;
  old.button?.focus({preventScroll:true});window.portfolioMediaOpen=false;document.dispatchEvent(new Event('media-mode-change'));
 }
 async function hide(){
  if(!state||closing)return closing||Promise.resolve();generation++;
  closing=(async()=>{
   const current=frame.getBoundingClientRect();animation?.cancel();
   if(state.docked){stage.append(frame);frame.style.cssText='position:fixed;z-index:5';state.docked=false;}
   Object.assign(frame.style,rectStyle(current));
   const target=state.placeholder.getBoundingClientRect(),animations=[];
   if(!reduced()){
    if(sheet)animations.push(sheet.animate([{opacity:1},{opacity:0}],{duration:520,fill:'forwards',easing:'ease'}).finished.catch(()=>{}));
    const opacity=getComputedStyle(shade).opacity;shade.getAnimations().forEach(a=>a.cancel());shade.animate([{opacity},{opacity:0}],{duration:520,fill:'forwards'});
    description.animate([{opacity:1},{opacity:0}],{duration:400,fill:'forwards'});
    animation=frame.animate([rectStyle(current),rectStyle(target)],{duration:520,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});animations.push(animation.finished.catch(()=>{}));await Promise.all(animations);
   }
   viewer.close();finish();closing=null;
  })();return closing;
 }
 function prepareCase(work,token){
  const ru=window.portfolioLanguage?.()==='ru';
  sheet=document.createElement('section');sheet.className='viewer-case-sheet case-entering';sheet.setAttribute('aria-label',work.title||'Project');sheet.tabIndex=-1;
  const toolbar=document.createElement('div');toolbar.className='viewer-case-toolbar';const brand=document.createElement('strong');brand.textContent='PANXRT';const close=document.createElement('button');close.type='button';close.textContent=ru?'НАЗАД':'BACK';close.onclick=hide;toolbar.append(brand,close);
  const content=window.buildProjectContent(work);content.querySelector('.case-back')?.addEventListener('click',e=>{e.preventDefault();hide();});
  const cover=[...content.querySelectorAll('.case-block-media')].find(n=>n.getAttribute('src')===work.src);
  let hero;
  if(cover){hero=cover.parentElement;hero.classList.add('viewer-case-destination');cover.remove();}
  else{hero=document.createElement('div');hero.className='viewer-case-destination';const heading=content.querySelector('.case-document-heading');if(heading)heading.after(hero);else content.prepend(hero);}
  sheet.append(toolbar,content);viewer.append(sheet);viewer.classList.add('has-case');

  const top=document.createElement('button');top.className='viewer-case-top';top.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';top.setAttribute('aria-label',ru?'В начало кейса':'Back to top');top.onclick=()=>sheet?.scrollTo({top:0,behavior:reduced()?'auto':'smooth'});sheet.append(top);
  if(!reduced()){sheet.animate([{opacity:0},{opacity:1}],{duration:650});for(const node of [toolbar,content.querySelector('.case-document-heading')].filter(Boolean))node.animate([{transform:'translateY(45px)',opacity:0},{transform:'none',opacity:1}],{duration:700,easing:'cubic-bezier(.22,.61,.36,1)'});}
  state.hero=hero;state.caseToken=token;
  document.dispatchEvent(new CustomEvent('analytics-case',{detail:work.id}));return hero;
 }
 function dockCase(token){
  if(!state||token!==generation||closing||!sheet)return;
  animation?.cancel();animation=null;state.hero.append(frame);frame.style.cssText='position:relative;left:0;top:0;width:100%;height:100%;z-index:1;border-radius:0';state.media.style.objectFit='contain';state.docked=true;sheet.classList.remove('case-entering');
  caseObserver=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting)e.target.play().catch(()=>{});else e.target.pause();}},{root:sheet,threshold:.15});
  sheet.querySelectorAll('video').forEach(video=>{video.loop=true;video.preload='metadata';if(video!==state.media)mobileControls(video);caseObserver.observe(video);});
  sheet.focus({preventScroll:true});
 }
 window.openMediaViewer=function(card,work){
  if(state||viewer.open)return false;const media=card.querySelector('img,video');if(!media)return false;
  const sourceRect=media.getBoundingClientRect(),surface=document.querySelector('.work .surface'),token=++generation,ru=window.portfolioLanguage?.()==='ru';
  const placeholder=document.createElement('span');placeholder.className='media-origin-placeholder';
  state={workId:work?.id,media,placeholder,style:media.style.cssText,controls:media.controls,surface,scroll:surface.scrollTop,button:card.querySelector('button')};
  media.replaceWith(placeholder);frame=document.createElement('div');frame.className='viewer-media-frame';frame.append(media);stage.append(frame);
  media.style.cssText='width:100%;height:100%;object-fit:cover;object-position:center;transform:none;scale:1;max-width:none;max-height:none;';
  if(media.tagName==='VIDEO'){state.cleanup=mobileControls(media);media.muted=false;media.playsInline=true;media.loop=true;}
  viewer.querySelector('h2').textContent=(ru?work?.titleRu:work?.title)||work?.title||card.dataset.title||'';
  viewer.querySelector('.viewer-type').textContent=(ru?work?.typeRu:work?.type)||work?.type||'';
  viewer.querySelector('.viewer-copy').textContent=(ru?work?.descriptionRu:work?.description)||work?.description||'';
  back.textContent=ru?'НАЗАД':'BACK';
  shade.getAnimations().forEach(a=>a.cancel());description.getAnimations().forEach(a=>a.cancel());
  window.portfolioMediaOpen=true;document.body.classList.add('media-open');viewer.showModal();
  const hasCase=work&&work.showFullProject!==false,hero=hasCase?prepareCase(work,token):null;
  const ratio=(media.videoWidth||media.naturalWidth)/(media.videoHeight||media.naturalHeight)||sourceRect.width/sourceRect.height;
  let target;
  if(hero){
   const r=hero.getBoundingClientRect();const width=r.width,height=width/ratio;
   // The animated cover occupies its authored case position, not a second preview.
   const oldHeight=r.height;hero.style.height=height+'px';
   const grid=hero.closest('.free-stage');if(grid){const delta=height-oldHeight;for(const node of grid.children){if(node!==hero&&node.getBoundingClientRect().top>=r.top+oldHeight-.5)node.style.top=(node.offsetTop+delta)+'px';}grid.style.height=(grid.getBoundingClientRect().height+delta)+'px';}
   const hr=hero.getBoundingClientRect();target={left:hr.left,top:hr.top,width,height};frame.style.zIndex='5';
  }else{const r=stage.getBoundingClientRect(),width=Math.min(r.width-28,(r.height-28)*ratio),height=width/ratio;target={left:r.left+(r.width-width)/2,top:r.top+(r.height-height)/2,width,height};}
  Object.assign(frame.style,rectStyle(target));
  if(!reduced()){
   animation=frame.animate([{...rectStyle(sourceRect),borderRadius:'14px'},{...rectStyle(target),borderRadius:hasCase?'0px':'14px'}],{duration:650,easing:'cubic-bezier(.22,.61,.36,1)',fill:'both'});
   shade.animate([{opacity:0},{opacity:1}],{duration:560});description.animate([{opacity:0},{opacity:1}],{duration:340,delay:160,fill:'backwards'});
  }
  back.focus({preventScroll:true});document.dispatchEvent(new Event('media-mode-change'));if(media.tagName==='VIDEO')media.play().catch(()=>{});
  if(hasCase){const ready=animation?animation.finished.catch(()=>{}):Promise.resolve();ready.then(()=>dockCase(token));}
  return true;
 };
 window.getPortfolioViewerState=()=>state?{id:state.workId,caseScroll:sheet?.scrollTop||0}:null;
 window.restoreCaseScroll=top=>{if(sheet)sheet.scrollTop=top;};
 window.closeMediaViewer=hide;back.onclick=hide;
 viewer.addEventListener('cancel',e=>{e.preventDefault();hide();});viewer.addEventListener('close',finish);
 viewer.addEventListener('click',e=>{if(e.target===viewer||e.target===stage)hide();});
 window.addEventListener('keydown',e=>{if(viewer.open&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();hide();}},true);
})();
