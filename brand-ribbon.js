(function(){
 let brands=[],lastWidth=0,signature="";
 function render(){const ribbon=document.getElementById('brand-ribbon'),track=ribbon.querySelector('.brand-track');track.replaceChildren();const visible=brands.filter(b=>b.src);if(!visible.length)return;
 const group=document.createElement('span');group.className='brand-group';const repeats=Math.max(1,Math.ceil((innerWidth+280)/(visible.length*170)));
 for(let r=0;r<repeats;r++)for(const b of visible){const wrap=document.createElement('span');wrap.className='brand-logo'+(b.id==='vozovoz'&&b.src==='/brand-vozovoz.png'?' brand-vozovoz':b.id==='tele2'?' brand-tele2':'');const img=document.createElement('img');img.src=b.src;img.alt=r?'':b.name;if(r)wrap.setAttribute('aria-hidden','true');wrap.append(img);group.append(wrap);}
 track.append(group);let fills=0;while(group.scrollWidth>0&&group.scrollWidth<innerWidth+280&&fills++<12){for(const original of [...group.children]){const extra=original.cloneNode(true);extra.setAttribute('aria-hidden','true');group.append(extra);}}const copy=group.cloneNode(true);copy.setAttribute('aria-hidden','true');track.append(group,copy);lastWidth=innerWidth;ribbon.classList.add("brands-ready");
 const surface=ribbon.parentElement,padding=parseFloat(getComputedStyle(surface).paddingLeft)||0;ribbon.style.marginLeft=-(padding+140)+'px';ribbon.style.width=(innerWidth+280)+'px';
 }
 window.renderBrandRibbon=list=>{const key=JSON.stringify(list);if(key===signature)return;signature=key;brands=list||[];render();};window.addEventListener('resize',()=>{if(lastWidth!==innerWidth)render();});
})();