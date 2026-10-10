(function(){
 const make=(tag,cls)=>{const n=document.createElement(tag);n.className=cls;return n;};
 function mount(stage,work,{snapshot,change}){
  if(stage._guideTools){stage._guideTools.draw();return;}
  stage.querySelectorAll('.case-ruler').forEach(n=>n.remove());
  let drag=null;
  function guides(){return work.guides||[];}
  function point(e){const r=stage.getBoundingClientRect(),scale=1200/(r.width||stage.clientWidth||900);return {x:(e.clientX-r.left)*scale,y:(e.clientY-r.top)*scale,height:r.height*scale};}
  function remove(id){work.guides=guides().filter(g=>g.id!==id);}
  function draw(){
   stage.querySelectorAll('.case-guide').forEach(n=>n.remove());
   for(const g of guides()){
    const line=make('button','case-guide '+g.axis);line.type='button';line.dataset.guide=g.id;line.title='Перетащите направляющую. Двойной клик или Delete — удалить.';line.setAttribute('aria-label',(g.axis==='x'?'Вертикальная':'Горизонтальная')+' направляющая '+Math.round(g.position));
    line.style[g.axis==='x'?'left':'top']=g.position/12+(g.axis==='x'?'%':'cqw');
    line.ondblclick=e=>{e.stopPropagation();snapshot();remove(g.id);change();draw();};
    line.onkeydown=e=>{if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();snapshot();remove(g.id);change();draw();}};
    stage.append(line);
   }
  }
  for(const side of ['left','top']){
   const ruler=make('div','case-ruler '+side);ruler.dataset.ruler=side==='left'?'x':'y';ruler.title=side==='left'?'Потяните вправо: вертикальная направляющая':'Потяните вниз: горизонтальная направляющая';ruler.setAttribute('aria-label',ruler.title);stage.append(ruler);
  }
  function ticks(){const h=Math.max(400,...(work.blocks||[]).map(b=>b.frame?b.frame.y+b.frame.h:0))+40;for(const side of ['left','top']){const ruler=stage.querySelector('.case-ruler.'+side),count=Math.ceil((side==='left'?h:1200)/100);if(ruler.dataset.count===String(count))continue;ruler.dataset.count=String(count);ruler.replaceChildren();for(let i=0;i<=count;i++){const tick=make('span','ruler-tick');tick.textContent=i*100;tick.style[side==='left'?'top':'left']=i*100/12+(side==='left'?'cqw':'%');ruler.append(tick);}}}
  stage.addEventListener('pointerdown',e=>{
   const source=e.target.closest('[data-ruler],[data-guide]');if(!source||e.button!==0)return;e.preventDefault();e.stopPropagation();snapshot();
   const original=structuredClone(guides());let guide=guides().find(g=>g.id===source.dataset.guide);if(!guide){guide={id:crypto.randomUUID(),axis:source.dataset.ruler,position:0};work.guides=[...guides(),guide];}
   drag={guide,original,pointer:e.pointerId};stage.setPointerCapture(e.pointerId);draw();
  });
  stage.addEventListener('pointermove',e=>{if(!drag)return;e.preventDefault();e.stopPropagation();const p=point(e);drag.guide.position=Math.max(0,Math.min(drag.guide.axis==='x'?1200:100000,p[drag.guide.axis]));draw();});
  function finish(e,cancel=false){if(!drag)return;e.preventDefault();e.stopPropagation();const p=point(e);if(cancel)work.guides=drag.original;else if(p.x<0||p.x>1200||p.y<0||p.y>p.height)remove(drag.guide.id);drag=null;change();draw();}
  stage.addEventListener('pointerup',e=>finish(e));stage.addEventListener('pointercancel',e=>finish(e,true));stage.addEventListener('lostpointercapture',e=>{if(drag)finish(e,true);});
  stage._guideTools={draw(){ticks();draw();}};ticks();draw();
 }
 function snap(frame,work,excluded,threshold=8,axis=null){
  const targets={x:[0,600,1200],y:[0]};for(const g of work.guides||[])targets[g.axis].push(g.position);
  for(const b of work.blocks||[]){if(excluded.has(b.id)||!b.frame)continue;const f=b.frame;targets.x.push(f.x,f.x+f.w/2,f.x+f.w);targets.y.push(f.y,f.y+f.h/2,f.y+f.h);}
  const result={...frame};for(const dimension of ['x','y']){if(axis&&axis!==dimension)continue;const size=dimension==='x'?'w':'h';let best=threshold,delta=0;for(const edge of [frame[dimension],frame[dimension]+frame[size]/2,frame[dimension]+frame[size]])for(const target of targets[dimension]){const d=target-edge;if(Math.abs(d)<best){best=Math.abs(d);delta=d;}}result[dimension]+=delta;}
  result.x=Math.max(0,Math.min(1200-result.w,result.x));result.y=Math.max(0,result.y);return result;
 }
 function align(blocks,command,canvasHeight){
  if(!blocks.length)return false;const f=blocks.map(b=>b.frame),single=f.length===1,bounds={l:single?0:Math.min(...f.map(x=>x.x)),r:single?1200:Math.max(...f.map(x=>x.x+x.w)),t:single?0:Math.min(...f.map(x=>x.y)),b:single?canvasHeight:Math.max(...f.map(x=>x.y+x.h))};
  if(command==='distribute-x'||command==='distribute-y'){
   if(f.length<3)return false;const axis=command.endsWith('x')?'x':'y',size=axis==='x'?'w':'h',sorted=[...f].sort((a,b)=>a[axis]-b[axis]),start=sorted[0][axis],last=sorted.at(-1),extent=last[axis]+last[size]-start,gap=(extent-sorted.reduce((s,a)=>s+a[size],0))/(f.length-1);if(gap<0)return false;let pos=start;for(const item of sorted){item[axis]=pos;pos+=item[size]+gap;}return true;
  }
  for(const item of f){if(command==='left')item.x=bounds.l;if(command==='center')item.x=(bounds.l+bounds.r-item.w)/2;if(command==='right')item.x=bounds.r-item.w;if(command==='top')item.y=bounds.t;if(command==='middle')item.y=(bounds.t+bounds.b-item.h)/2;if(command==='bottom')item.y=bounds.b-item.h;}return true;
 }
 window.CaseTools={mount,snap,align};
})();
