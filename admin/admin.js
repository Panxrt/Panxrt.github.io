'use strict';

const DRAFT_KEY='panxrt-admin-dev-draft-v2';
let data=null, selectedWorkId=null, selectedBrandId=null, currentTab='works';
let dragWorkId=null, dragBrandId=null, toastTimer=null, previewObserver=null;
const $=id=>document.getElementById(id);
const clone=v=>JSON.parse(JSON.stringify(v));
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function mediaUrl(src){
  if(!src)return '';
  if(/^https?:\/\//i.test(src))return src;
  return src.startsWith('/')?'..'+src:'../'+src.replace(/^\.\//,'');
}
function uuid(){return crypto.randomUUID?crypto.randomUUID():'id-'+Date.now()+'-'+Math.random().toString(16).slice(2)}
function toast(message){const n=$('toast');n.textContent=message;n.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('show'),1400)}
function saveQuiet(){localStorage.setItem(DRAFT_KEY,JSON.stringify(data))}
function selectedWork(){return data?.works.find(w=>w.id===selectedWorkId)||null}
function selectedBrand(){return data?.brands.find(b=>b.id===selectedBrandId)||null}

async function load(){
  const response=await fetch('../content.json',{cache:'no-store'});
  if(!response.ok)throw new Error('Не удалось загрузить content.json');
  const server=await response.json();
  const draft=localStorage.getItem(DRAFT_KEY);
  if(draft){try{data=JSON.parse(draft);toast('Открыт локальный черновик')}catch{data=clone(server)}}else data=clone(server);
  data.brands=Array.isArray(data.brands)?data.brands:[];
  data.works=Array.isArray(data.works)?data.works:[];
  data.categories=Array.isArray(data.categories)?data.categories:[];
  data.galleryLayout=data.galleryLayout||{mode:'rows',columns:8};
  selectedWorkId=data.works[0]?.id||null;
  renderAll();
}

function renderAll(){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('is-active',b.dataset.tab===currentTab));
  $('worksPanel').hidden=currentTab!=='works';$('brandsPanel').hidden=currentTab!=='brands';
  renderWorkList();renderBrandList();renderPreview();renderInspector();
  $('workCount').textContent=data.works.length;$('brandCount').textContent=data.brands.length;
}
function thumbMarkup(item){
  const src=mediaUrl(item.src);if(!src)return '<span>—</span>';
  return item.mediaType==='video'?'<video src="'+esc(src)+'" muted playsinline preload="metadata"></video>':'<img src="'+esc(src)+'" alt="">';
}
function renderWorkList(){
  const list=$('workList');list.innerHTML='';
  data.works.forEach((w,i)=>{
    const n=document.createElement('div');n.className='list-item'+(w.id===selectedWorkId?' is-active':'');n.draggable=true;n.dataset.id=w.id;
    n.innerHTML='<div class="thumb">'+thumbMarkup(w)+'</div><div class="list-copy"><strong>'+esc(w.title||'Без названия')+'</strong><span>#'+(i+1)+' · '+esc(w.description||'')+'</span></div><span class="drag">⋮⋮</span>';
    n.addEventListener('click',()=>{currentTab='works';selectedWorkId=w.id;selectedBrandId=null;renderAll()});
    n.addEventListener('dragstart',()=>{dragWorkId=w.id;n.classList.add('dragging')});n.addEventListener('dragend',()=>{dragWorkId=null;n.classList.remove('dragging')});
    n.addEventListener('dragover',e=>e.preventDefault());n.addEventListener('drop',e=>{e.preventDefault();moveWork(dragWorkId,w.id)});
    list.append(n);
  });
}
function renderBrandList(){
  const list=$('brandList');list.innerHTML='';
  data.brands.forEach((b,i)=>{
    const n=document.createElement('div');n.className='list-item'+(b.id===selectedBrandId?' is-active':'');n.draggable=true;
    n.innerHTML='<div class="thumb"><img src="'+esc(mediaUrl(b.src))+'" alt=""></div><div class="list-copy"><strong>'+esc(b.name||'Без названия')+'</strong><span>#'+(i+1)+'</span></div><span class="drag">⋮⋮</span>';
    n.addEventListener('click',()=>{currentTab='brands';selectedBrandId=b.id;selectedWorkId=null;renderAll()});
    n.addEventListener('dragstart',()=>{dragBrandId=b.id;n.classList.add('dragging')});n.addEventListener('dragend',()=>{dragBrandId=null;n.classList.remove('dragging')});
    n.addEventListener('dragover',e=>e.preventDefault());n.addEventListener('drop',e=>{e.preventDefault();moveBrand(dragBrandId,b.id)});
    list.append(n);
  });
}
function moveItem(arr,sourceId,targetId){
  if(!sourceId||sourceId===targetId)return false;
  const from=arr.findIndex(x=>x.id===sourceId),to=arr.findIndex(x=>x.id===targetId);if(from<0||to<0)return false;
  const [item]=arr.splice(from,1);arr.splice(to,0,item);return true;
}
function moveWork(a,b){if(moveItem(data.works,a,b)){selectedWorkId=a;saveQuiet();renderAll();toast('Плитка переставлена')}}
function moveBrand(a,b){if(moveItem(data.brands,a,b)){saveQuiet();renderAll();toast('Порядок брендов изменён')}}

function makeMedia(work){
  const node=document.createElement(work.mediaType==='video'?'video':'img');
  node.src=mediaUrl(work.src);
  if(node.tagName==='VIDEO'){node.muted=true;node.defaultMuted=true;node.loop=true;node.playsInline=true;node.preload='metadata'}
  else{node.alt='';node.loading='lazy';node.decoding='async'}
  window.MosaicLayout?.styleMedia(node,work);
  return node;
}
function applyExactLayout(){
  const grid=$('galleryPreview');if(!grid||!window.MosaicLayout)return;
  grid._layout=data.galleryLayout;
  window.MosaicLayout.apply(grid,data.works,true);
}
function renderPreview(){
  const grid=$('galleryPreview');grid.replaceChildren();
  for(const work of data.works){
    const card=document.createElement('article');
    card.className='gallery-card admin-gallery-card'+(work.id===selectedWorkId?' is-active':'');
    card.dataset.id=work.id;card.draggable=true;
    card.style.setProperty('--cols',work.width||1);card.style.setProperty('--rows',work.height||1);
    const button=document.createElement('button');button.type='button';button.className='card-button';button.tabIndex=-1;
    if(work.src)button.append(makeMedia(work));
    const caption=document.createElement('span');caption.className='admin-caption';
    caption.innerHTML='<b>'+esc(work.title||'Без названия')+'</b><span>'+esc(work.description||'')+'</span>';
    const grip=document.createElement('span');grip.className='tile-grip';grip.textContent='⋮⋮';
    button.append(caption,grip);card.append(button);

    card.addEventListener('click',()=>{currentTab='works';selectedWorkId=work.id;selectedBrandId=null;renderAll()});
    card.addEventListener('dragstart',e=>{dragWorkId=work.id;card.classList.add('dragging');e.dataTransfer.effectAllowed='move'});
    card.addEventListener('dragend',()=>{dragWorkId=null;card.classList.remove('dragging');document.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'))});
    card.addEventListener('dragenter',e=>{e.preventDefault();if(dragWorkId&&dragWorkId!==work.id)card.classList.add('drop-target')});
    card.addEventListener('dragleave',()=>card.classList.remove('drop-target'));
    card.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move'});
    card.addEventListener('drop',e=>{e.preventDefault();card.classList.remove('drop-target');moveWork(dragWorkId,work.id)});
    grid.append(card);
  }
  requestAnimationFrame(applyExactLayout);
  if(!previewObserver){
    previewObserver=new ResizeObserver(()=>applyExactLayout());
    previewObserver.observe($('previewShell'));
  }
}

function renderInspector(){
  const w=selectedWork(),b=selectedBrand();$('emptyInspector').hidden=!!(w||b);$('workEditor').hidden=!w;$('brandEditor').hidden=!b;
  if(w)renderWorkEditor(w);if(b)renderBrandEditor(b);
}
function estimatedSize(work){
  return {w:Math.round(Number(work.cardW)||Number(work.width)*200||400),h:Math.round(Number(work.cardH)||Number(work.height)*200||400)}
}
function renderWorkEditor(w){
  $('editorTitle').textContent=w.title||'Без названия';$('titleInput').value=w.title||'';$('descriptionInput').value=w.description||'';$('srcInput').value=w.src||'';
  $('mediaTypeInput').value=w.mediaType==='video'?'video':'image';$('mediaFitInput').value=w.mediaFit==='contain'?'contain':'cover';$('fullProjectInput').checked=!!w.showFullProject;
  const size=estimatedSize(w);$('cardWInput').value=Math.max(80,Math.min(1000,size.w));$('cardHInput').value=Math.max(80,Math.min(1000,size.h));updateSizeLabels();
  const box=$('categoryChecks');box.innerHTML='';
  data.categories.forEach(cat=>{
    const label=document.createElement('label'),checked=(w.categoryIds||[]).includes(cat.id);
    label.innerHTML='<input type="checkbox" value="'+esc(cat.id)+'" '+(checked?'checked':'')+'><span>'+esc(cat.name)+'</span>';
    label.querySelector('input').addEventListener('change',()=>{w.categoryIds=[...box.querySelectorAll('input:checked')].map(i=>i.value);saveQuiet();toast('Категории сохранены')});
    box.append(label);
  });
}
function renderBrandEditor(b){$('brandEditorTitle').textContent=b.name||'Без названия';$('brandNameInput').value=b.name||'';$('brandSrcInput').value=b.src||'';$('brandPreviewImage').src=mediaUrl(b.src)}
function updateSizeLabels(){$('cardWValue').textContent=$('cardWInput').value+' px';$('cardHValue').textContent=$('cardHInput').value+' px'}
function updateWork(key,value,mirrorRu=false){
  const w=selectedWork();if(!w)return;w[key]=value;if(mirrorRu&&Object.prototype.hasOwnProperty.call(w,key+'Ru'))w[key+'Ru']=value;
  saveQuiet();renderWorkList();renderPreview();$('editorTitle').textContent=w.title||'Без названия';
}
function updateVisualSize(){
  const w=selectedWork();if(!w)return;w.cardW=Number($('cardWInput').value);w.cardH=Number($('cardHInput').value);w.resizeMode='free';updateSizeLabels();saveQuiet();renderPreview();
}
function resetVisualSize(){
  const w=selectedWork();if(!w)return;delete w.cardW;delete w.cardH;delete w.resizeMode;saveQuiet();renderAll();toast('Размер сброшен');
}
function updateBrand(key,value){const b=selectedBrand();if(!b)return;b[key]=value;saveQuiet();renderBrandList();$('brandEditorTitle').textContent=b.name||'Без названия';$('brandPreviewImage').src=mediaUrl(b.src)}
function addWork(){
  const item={id:uuid(),title:'New project',titleRu:'Новый проект',type:'Design',typeRu:'Дизайн',description:'',descriptionRu:'',body:'',bodyRu:'',src:'',mediaType:'image',projectMedia:[],width:1,height:1,showFullProject:false,categoryIds:[]};
  data.works.push(item);selectedWorkId=item.id;selectedBrandId=null;currentTab='works';saveQuiet();renderAll();toast('Проект добавлен');
}
function addBrand(){const item={id:uuid(),name:'Новый бренд',src:''};data.brands.push(item);selectedBrandId=item.id;selectedWorkId=null;currentTab='brands';saveQuiet();renderAll();toast('Бренд добавлен')}
function deleteWork(){const w=selectedWork();if(!w||!confirm('Удалить проект «'+(w.title||'Без названия')+'» из черновика?'))return;const i=data.works.findIndex(x=>x.id===w.id);data.works.splice(i,1);selectedWorkId=data.works[Math.min(i,data.works.length-1)]?.id||null;saveQuiet();renderAll();toast('Проект удалён')}
function deleteBrand(){const b=selectedBrand();if(!b||!confirm('Удалить бренд «'+(b.name||'Без названия')+'» из черновика?'))return;const i=data.brands.findIndex(x=>x.id===b.id);data.brands.splice(i,1);selectedBrandId=data.brands[Math.min(i,data.brands.length-1)]?.id||null;saveQuiet();renderAll();toast('Бренд удалён')}
function exportJson(){const out=clone(data);out.revision=Math.max(Number(out.revision)||0,1)+1;const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='content-admin-preview.json';a.click();URL.revokeObjectURL(url);toast('JSON скачан')}
async function resetDraft(){if(!confirm('Удалить локальный черновик и снова загрузить текущий content.json?'))return;localStorage.removeItem(DRAFT_KEY);data=null;selectedWorkId=null;selectedBrandId=null;await load()}

document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{currentTab=b.dataset.tab;if(currentTab==='works'){selectedBrandId=null;selectedWorkId=selectedWorkId||data.works[0]?.id||null}else{selectedWorkId=null;selectedBrandId=selectedBrandId||data.brands[0]?.id||null}renderAll()}));
$('addWorkBtn').addEventListener('click',addWork);$('addBrandBtn').addEventListener('click',addBrand);$('deleteWorkBtn').addEventListener('click',deleteWork);$('deleteBrandBtn').addEventListener('click',deleteBrand);
$('exportBtn').addEventListener('click',exportJson);$('resetBtn').addEventListener('click',resetDraft);$('resetSizeBtn').addEventListener('click',resetVisualSize);
$('preview-size').addEventListener('change',e=>{$('previewShell').className='preview-shell '+e.target.value;requestAnimationFrame(()=>requestAnimationFrame(applyExactLayout))});
$('titleInput').addEventListener('input',e=>updateWork('title',e.target.value,true));$('descriptionInput').addEventListener('input',e=>updateWork('description',e.target.value,true));
$('srcInput').addEventListener('change',e=>{updateWork('src',e.target.value);renderInspector()});$('mediaTypeInput').addEventListener('change',e=>updateWork('mediaType',e.target.value));$('mediaFitInput').addEventListener('change',e=>updateWork('mediaFit',e.target.value));$('fullProjectInput').addEventListener('change',e=>updateWork('showFullProject',e.target.checked));
$('cardWInput').addEventListener('input',updateVisualSize);$('cardHInput').addEventListener('input',updateVisualSize);
$('brandNameInput').addEventListener('input',e=>updateBrand('name',e.target.value));$('brandSrcInput').addEventListener('change',e=>updateBrand('src',e.target.value));
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveQuiet();toast('Черновик сохранён')}});
document.addEventListener('mosaic-media-ready',()=>requestAnimationFrame(applyExactLayout));
load().catch(err=>{console.error(err);$('galleryPreview').innerHTML='<div style="padding:24px;color:#f3b6b6">'+esc(err.message)+'</div>'});
