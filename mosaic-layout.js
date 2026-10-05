(function(){
 const nativeRatios=new Map();
 const ordered=works=>[...works.filter(w=>!!w.src),...works.filter(w=>!w.src)];
 // Justified rows cover the entire width. No skyline cavities or overlapping tiles.
 // Media aspect ratios are preserved; requested dimensions determine row density.
 const resizing=new WeakMap();
 function pack(works,reference,gutter,fixedRows){
  const items=[];let y=1;
  for(const group of [works.filter(w=>!!w.src),works.filter(w=>!w.src)]){
   const cards=group.map(w=>{const width=Math.max(40,w.cardW||w.width*200||400),ratio=w.resizeMode!=='free'?nativeRatios.get(w.src):null;return {work:w,w:width,h:ratio?width/ratio:Math.max(40,w.cardH||w.height*200||400)};});
   const cost=Array(cards.length+1).fill(Infinity),next=[];cost[cards.length]=0;
   for(let i=cards.length-1;i>=0;i--){let ratios=0,target=0;
    for(let j=i;j<Math.min(cards.length,i+8);j++){
     if(j>i&&cards[j].work.rowBreakBefore)break;const c=cards[j];ratios+=c.w/c.h;target+=Math.min(reference*.6,Math.max(reference*.16,c.h));
     const n=j-i+1,h=(reference-n*gutter)/ratios;if(h<=0)break;
     const desired=target/n,dist=Math.log(h/desired),score=dist*dist*n+cost[j+1];
     if(score<cost[i]){cost[i]=score;next[i]=j+1;}
    }
   }
   for(let i=0;i<cards.length;){const fixed=fixedRows?.find(row=>row.includes(cards[i].work.id)),end=fixed?Math.min(cards.length,i+fixed.length):next[i]||i+1,row=cards.slice(i,end),ratios=row.reduce((sum,c)=>sum+c.w/c.h,0),widths=row.reduce((sum,c)=>sum+c.w,0),wantedHeight=row.reduce((sum,c)=>sum+c.h,0)/row.length,height=(reference-row.length*gutter)/ratios;let x=0,exact=0;
    for(let k=0;k<row.length;k++){const c=row[k],right=k===row.length-1?1200:Math.round(exact+=(height*c.w/c.h+gutter)/reference*1200);items.push({id:c.work.id,start:x+1,span:right-x,row:y,height:height+gutter});x=right;}
    y+=height+gutter;i=end;
   }
  }
  return items;
 }
 function packMosaic(works,columns,unit,gap){
  const placed=[];
  for(const w of ordered(works)){
   const span=Math.min(columns,Math.max(1,w.gridCols||Math.round((w.cardW||400)/200)));
   const ratio=nativeRatios.get(w.src)||(w.pixelWidth/w.pixelHeight)||((w.cardW||400)/(w.cardH||400));
   const h=Math.max(40,Math.round(w.gridRows?unit*w.gridRows:(unit*span-gap)/ratio+gap));
   let best=null;
   for(let x=0;x<=columns-span;x++){
    let y=0;
    if(w.rowBreakBefore)y=Math.max(0,...placed.map(p=>p.y+p.h));
    const obstacles=placed.filter(p=>p.x<x+span&&p.x+p.span>x).sort((a,b)=>a.y-b.y);
    for(const p of obstacles){if(y+h<=p.y)break;if(y<p.y+p.h)y=p.y+p.h;}
    if(!best||y<best.y)best={id:w.id,x,span,y,h};
   }
   placed.push(best);
  }
  return placed;
 }
 // Explicit row bands keep spanning tiles reserved while neighbours fill each free interval.
 function packRows(works,rows,reference=1200,gap=16,maxCount=300){
  const queue=ordered(works).slice(),items=[],heights=[];let row=0;
  while(queue.length||items.some(p=>p.row+p.rows>row)){
   const spec=rows[row]||rows.at(-1)||{count:4,height:300};heights.push(Math.max(40,spec.height||300));
   const active=items.filter(p=>p.row<row&&p.row+p.rows>row).sort((a,b)=>a.x-b.x),free=[];let edge=0;
   for(const p of active){if(p.x>edge)free.push({x:edge,w:p.x-edge});edge=Math.max(edge,p.x+p.w);}if(edge<1200)free.push({x:edge,w:1200-edge});
   if(!queue.length){row++;if(row>works.length*3+3)break;continue;}
   const count=Math.min(queue.length,Math.max(free.length,Math.min(maxCount,Math.max(1,Math.floor(1200/(gap+12))),spec.count||4)-active.length));
   let remaining=count,total=free.reduce((n,f)=>n+f.w,0);
   for(let f=0;f<free.length&&remaining;f++){
    const region=free[f],n=f===free.length-1?remaining:Math.max(1,Math.min(remaining-(free.length-f-1),Math.round(count*region.w/total))),group=queue.splice(0,Math.min(n,Math.max(1,Math.floor(region.w/(gap+12)))));
    const weights=group.map(w=>(w.resizeMode!=='free'&&nativeRatios.get(w.src))||((w.cardW||400)/(w.cardH||400))),sum=weights.reduce((a,b)=>a+b,0);let x=region.x;
    group.forEach((w,i)=>{const right=i===group.length-1?region.x+region.w:Math.round(x+(region.w-group.length*gap)*weights[i]/sum+gap);items.push({id:w.id,x,w:right-x,row,rows:Math.min(w.rowSpan||1,3)});x=right;});remaining-=group.length;
   }
   row++;if(row>works.length*3+3)break;
  }
  return {items,heights};
 }
 function apply(grid,works,admin=false){
  const available=grid.clientWidth||900,mode=admin?document.getElementById('preview-size').value:'',columns=admin?(mode==='mobile'?3:mode==='tablet'?4:6):(innerWidth<=700?3:innerWidth<=1050?4:6),ref=columns*200,gap=columns===3?10:16,scale=(available-gap)/ref;
  const settings=admin?grid._layout:window.portfolioData?.galleryLayout;
  if(settings?.rows?.length){
   const responsiveMax=admin?(mode==='mobile'?2:mode==='tablet'?4:300):(innerWidth<=700?2:innerWidth<=1050?4:300),factor=(available-gap)/1200,result=packRows(works,settings.rows,1200,gap/factor,responsiveMax);
   grid.classList.add('fine-mosaic');grid.style.setProperty('--fine-gap',gap+'px');grid.style.setProperty('--fine-row','auto');grid.style.gridTemplateRows=result.heights.map(h=>h*factor+'px').join(' ');grid._mosaicRef=1200;grid._mosaicItems=result.items.map(p=>({id:p.id,row:p.row+1,height:result.heights[p.row],start:p.x+1,span:p.w}));
   const nodes=new Map([...grid.children].map(n=>[n.dataset.id,n]));for(const p of result.items){const node=nodes.get(p.id);if(!node)continue;node.style.setProperty('--tile-start',p.x+1);node.style.setProperty('--tile-span',p.w);node.style.setProperty('--tile-row',p.row+1);node.style.setProperty('--tile-height',p.rows);const media=node.querySelector('img,video');if(media)media.style.objectFit='cover';}return 1200;
  }
  if(settings?.mode==='mosaic'){
   const count=Math.min(settings.columns||5,admin?(mode==='mobile'?2:mode==='tablet'?4:8):(innerWidth<=700?2:innerWidth<=1050?4:8));
   const unit=(available-gap)/count,items=packMosaic(works,count,unit,gap);
   grid.classList.add('fine-mosaic');grid.style.setProperty('--fine-gap',gap+'px');grid.style.setProperty('--fine-row','1px');grid.style.gridTemplateRows='none';grid._mosaicRef=count*200;grid._mosaicItems=items;
   const nodes=new Map([...grid.children].map(n=>[n.dataset.id,n]));
   for(const item of items){const node=nodes.get(item.id);if(!node)continue;const start=Math.round(item.x/count*1200),end=Math.round((item.x+item.span)/count*1200);node.style.setProperty('--tile-start',start+1);node.style.setProperty('--tile-span',end-start);node.style.setProperty('--tile-row',item.y+1);node.style.setProperty('--tile-height',item.h);const media=node.querySelector('img,video'),w=works.find(w=>w.id===item.id);if(media)media.style.objectFit=w.gridRows?'cover':(w.mediaFit||'cover');}
   return grid._mosaicRef;
  }
  const items=pack(works,ref,gap/scale,resizing.get(grid)),rows=[...new Set(items.map(i=>i.row))],heights=rows.map(row=>items.find(i=>i.row===row).height*scale);
  grid.classList.add('fine-mosaic');grid.style.setProperty('--fine-gap',gap+'px');grid.style.setProperty('--fine-row','auto');grid.style.gridTemplateRows=heights.map(h=>h+'px').join(' ');grid._mosaicRef=ref;grid._mosaicItems=items;
  const nodes=new Map([...grid.children].map(n=>[n.dataset.id,n]));for(const item of items){const node=nodes.get(item.id);if(node){node.style.setProperty('--tile-start',item.start);node.style.setProperty('--tile-span',item.span);node.style.setProperty('--tile-row',rows.indexOf(item.row)+1);node.style.setProperty('--tile-height',1);}}return ref;
 }
 function proportionalSize(width,height,dx,dy,axis='se'){
  const change=axis==='e'?dx/width:axis==='s'?dy/height:(dx*width+dy*height)/(width*width+height*height),lower=Math.max(40/width,40/height),upper=Math.min(1200/width,1200/height),factor=Math.max(Math.min(lower,upper),Math.min(upper,1+change));return {width:width*factor,height:height*factor};
 }
 function styleMedia(node,w){if(!node._ratioReady){node._ratioReady=true;const source=w.src;const ready=()=>{const ratio=(node.videoWidth||node.naturalWidth)/(node.videoHeight||node.naturalHeight);if(Number.isFinite(ratio)&&ratio>0&&nativeRatios.get(source)!==ratio){nativeRatios.set(source,ratio);document.dispatchEvent(new Event('mosaic-media-ready'));}};node.addEventListener(node.tagName==='VIDEO'?'loadedmetadata':'load',ready,{once:true});if(node.complete||node.readyState>=1)queueMicrotask(ready);}node.style.objectFit=w.mediaFit||'cover';node.style.objectPosition=(w.focalX??50)+'% '+(w.focalY??50)+'%';node.style.scale=String((w.mediaZoom??100)/100);node.style.transformOrigin=(w.focalX??50)+'% '+(w.focalY??50)+'%';}
 function begin(grid){const items=grid._mosaicItems||[];resizing.set(grid,[...new Set(items.map(i=>i.row))].map(row=>items.filter(i=>i.row===row).map(i=>i.id)));}
 function end(grid){resizing.delete(grid);}
 window.MosaicLayout={styleMedia,apply,pack,packRows,packMosaic,ordered,proportionalSize,begin,end};
})();
