'use strict';
window.portfolioData=null;
function mediaNode(item){const node=document.createElement(item.mediaType==='video'?'video':'img');node.src=item.src;MosaicLayout.styleMedia(node,item);if(node.tagName==='VIDEO'){node.muted=true;node.defaultMuted=true;node.loop=true;node.autoplay=false;node.playsInline=true;node.preload='none';}else{node.alt='';node.loading='lazy';node.decoding='async';}return node;}
function renderPortfolio(data){
 window.portfolioData=data;
 window.renderBrandRibbon(data.brands);
 const grid=document.getElementById('gallery-grid');grid.replaceChildren();
 for(const w of MosaicLayout.ordered(data.works)){const card=document.createElement('article');card.className='gallery-card';card.dataset.id=w.id;card.dataset.title=w.title;card.dataset.type=w.type;card.style.setProperty('--cols',w.width);card.style.setProperty('--rows',w.height);const button=document.createElement('button');button.className='card-button';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','project-detail');button.setAttribute('aria-label','Show project '+w.title);if(w.src)button.append(mediaNode(w));const caption=document.createElement('span');caption.className='work-caption';const title=document.createElement('strong'),description=document.createElement('span'),more=document.createElement('span');title.className='work-caption-title';description.className='work-caption-description';more.className='work-caption-more';caption.append(title,description,more);button.append(caption);card.append(button);grid.append(card);} grid._fineWorks=data.works;{MosaicLayout.apply(grid,data.works);if(!grid._fineObserver){grid._fineObserver=new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(grid._lastWidth===width)return;grid._lastWidth=width;MosaicLayout.apply(grid,grid._fineWorks);});grid._fineObserver.observe(grid);}}
 document.dispatchEvent(new Event('portfolio-content'));window.translatePage?.(false);
}
let contentRevision=-1,refreshing=false;
async function refreshContent(){if(refreshing||window.portfolioMediaOpen)return;refreshing=true;try{const response=await fetch('./content.json',{cache:'no-store'});if(!response.ok)throw new Error('Content unavailable');const data=await response.json();if(contentRevision<data.revision){contentRevision=data.revision;renderPortfolio(data);}}catch(e){console.warn('Portfolio content could not refresh',e);}finally{refreshing=false;}}
try{const channel=new BroadcastChannel('panxrt-content');channel.onmessage=refreshContent;}catch{}
refreshContent();
window.buildProjectContent=function(work){return window.CaseRenderer.render(work,window.portfolioLanguage?.()||'en');};


document.addEventListener('mosaic-media-ready',()=>{const grid=document.getElementById('gallery-grid');if(grid?._fineWorks)MosaicLayout.apply(grid,grid._fineWorks);});
