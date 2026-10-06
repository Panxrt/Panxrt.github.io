'use strict';

const DRAFT_KEY='panxrt-admin-dev-draft-v1';
let data=null;
let selectedWorkId=null;
let selectedBrandId=null;
let currentTab='works';
let dragWorkId=null;
let dragBrandId=null;
let toastTimer=null;

const $=id=>document.getElementById(id);
const clone=value=>JSON.parse(JSON.stringify(value));
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function mediaUrl(src){
  if(!src)return '';
  if(/^https?:\/\//i.test(src))return src;
  return src.startsWith('/')?'..'+src:'../'+src.replace(/^\.\//,'');
}
function uuid(){
  return crypto.randomUUID?crypto.randomUUID():'id-'+Date.now()+'-'+Math.random().toString(16).slice(2);
}
function showToast(message){
  const node=$('toast');node.textContent=message;node.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('show'),1400);
}
function saveDraft(){
  localStorage.setItem(DRAFT_KEY,JSON.stringify(data));
  showToast('Черновик сохранён');
}
function saveQuiet(){
  localStorage.setItem(DRAFT_KEY,JSON.stringify(data));
}
function selectedWork(){return data?.works.find(w=>w.id===selectedWorkId)||null}
function selectedBrand(){return data?.brands.find(b=>b.id===selectedBrandId)||null}

async function load(){
  const response=await fetch('../content.json',{cache:'no-store'});
  if(!response.ok)throw new Error('Не удалось загрузить content.json');
  const server=await response.json();
  const draft=localStorage.getItem(DRAFT_KEY);
  if(draft){
    try{data=JSON.parse(draft);showToast('Открыт локальный черновик');}
    catch{data=clone(server)}
  }else data=clone(server);
  ensureShape();
  selectedWorkId=data.works[0]?.id||null;
  renderAll();
}
function ensureShape(){
  data.brands=Array.isArray(data.brands)?data.brands:[];
  data.works=Array.isArray(data.works)?data.works:[];
  data.categories=Array.isArray(data.categories)?data.categories:[];
  data.galleryLayout=data.galleryLayout||{mode:'rows',columns:8};
}
function renderAll(){
  renderTabs();
  renderWorkList();
  renderBrandList();
  renderPreview();
  renderInspector();
  $('workCount').textContent=data.works.length;
  $('brandCount').textContent=data.brands.length;
}
function renderTabs(){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('is-active',b.dataset.tab===currentTab));
  $('worksPanel').hidden=currentTab!=='works';
  $('brandsPanel').hidden=currentTab!=='brands';
}
function thumbMarkup(item){
  const src=mediaUrl(item.src);
  if(!src)return '<span>—</span>';
  return item.mediaType==='video'
    ? '<video src="'+escapeHtml(src)+'" muted playsinline preload="metadata"></video>'
    : '<img src="'+escapeHtml(src)+'" alt="">';
}
function renderWorkList(){
  const list=$('workList');list.innerHTML='';
  data.works.forEach((work,index)=>{
    const node=document.createElement('div');
    node.className='list-item'+(work.id===selectedWorkId?' is-active':'');
    node.draggable=true;
    node.dataset.id=work.id;
    node.innerHTML='<div class="thumb">'+thumbMarkup(work)+'</div><div class="list-copy"><strong>'+
      escapeHtml(work.title||'Без названия')+'</strong><span>#'+(index+1)+' · '+escapeHtml(work.description||'')+
      '</span></div><span class="drag">⋮⋮</span>';
    node.addEventListener('click',()=>{currentTab='works';selectedWorkId=work.id;selectedBrandId=null;renderAll()});
    node.addEventListener('dragstart',()=>{dragWorkId=work.id;node.classList.add('dragging')});
    node.addEventListener('dragend',()=>{dragWorkId=null;node.classList.remove('dragging')});
    node.addEventListener('dragover',e=>e.preventDefault());
    node.addEventListener('drop',e=>{e.preventDefault();moveWork(dragWorkId,work.id)});
    list.append(node);
  });
}
function renderBrandList(){
  const list=$('brandList');list.innerHTML='';
  data.brands.forEach((brand,index)=>{
    const node=document.createElement('div');
    node.className='list-item'+(brand.id===selectedBrandId?' is-active':'');
    node.draggable=true;node.dataset.id=brand.id;
    node.innerHTML='<div class="thumb"><img src="'+escapeHtml(mediaUrl(brand.src))+'" alt=""></div><div class="list-copy"><strong>'+
      escapeHtml(brand.name||'Без названия')+'</strong><span>#'+(index+1)+'</span></div><span class="drag">⋮⋮</span>';
    node.addEventListener('click',()=>{currentTab='brands';selectedBrandId=brand.id;selectedWorkId=null;renderAll()});
    node.addEventListener('dragstart',()=>{dragBrandId=brand.id;node.classList.add('dragging')});
    node.addEventListener('dragend',()=>{dragBrandId=null;node.classList.remove('dragging')});
    node.addEventListener('dragover',e=>e.preventDefault());
    node.addEventListener('drop',e=>{e.preventDefault();moveBrand(dragBrandId,brand.id)});
    list.append(node);
  });
}
function moveItem(arr,sourceId,targetId){
  if(!sourceId||sourceId===targetId)return false;
  const from=arr.findIndex(x=>x.id===sourceId),to=arr.findIndex(x=>x.id===targetId);
  if(from<0||to<0)return false;
  const [item]=arr.splice(from,1);arr.splice(to,0,item);return true;
}
function moveWork(source,target){
  if(moveItem(data.works,source,target)){saveQuiet();renderAll();showToast('Порядок проектов изменён')}
}
function moveBrand(source,target){
  if(moveItem(data.brands,source,target)){saveQuiet();renderAll();showToast('Порядок брендов изменён')}
}
function renderPreview(){
  const grid=$('galleryPreview');grid.innerHTML='';
  data.works.forEach(work=>{
    const card=document.createElement('article');
    card.className='preview-card'+(work.id===selectedWorkId?' is-active':'');
    card.dataset.id=work.id;card.draggable=true;
    const cols=Math.max(1,Math.min(3,Number(work.width)||1));
    const rows=Math.max(1,Math.min(3,Number(work.height)||1));
    card.style.gridColumn='span '+cols;card.style.gridRow='span '+rows;
    card.style.setProperty('--fit',work.mediaFit||'cover');
    const src=mediaUrl(work.src);
    let media='';
    if(src)media=work.mediaType==='video'
      ? '<video src="'+escapeHtml(src)+'" muted loop playsinline preload="metadata"></video>'
      : '<img src="'+escapeHtml(src)+'" alt="">';
    card.innerHTML=media+'<div class="caption"><b>'+escapeHtml(work.title||'Без названия')+
      '</b><span>'+escapeHtml(work.description||'')+'</span></div>';
    card.addEventListener('click',()=>{currentTab='works';selectedWorkId=work.id;selectedBrandId=null;renderAll()});
    card.addEventListener('dragstart',()=>{dragWorkId=work.id;card.classList.add('dragging')});
    card.addEventListener('dragend',()=>{dragWorkId=null;card.classList.remove('dragging')});
    card.addEventListener('dragover',e=>e.preventDefault());
    card.addEventListener('drop',e=>{e.preventDefault();moveWork(dragWorkId,work.id)});
    grid.append(card);
  });
}
function renderInspector(){
  const work=selectedWork(),brand=selectedBrand();
  $('emptyInspector').hidden=!!(work||brand);
  $('workEditor').hidden=!work;
  $('brandEditor').hidden=!brand;
  if(work)renderWorkEditor(work);
  if(brand)renderBrandEditor(brand);
}
function renderWorkEditor(work){
  $('editorTitle').textContent=work.title||'Без названия';
  $('titleInput').value=work.title||'';
  $('descriptionInput').value=work.description||'';
  $('srcInput').value=work.src||'';
  $('mediaTypeInput').value=work.mediaType==='video'?'video':'image';
  $('mediaFitInput').value=work.mediaFit==='contain'?'contain':'cover';
  $('widthInput').value=String(Math.max(1,Math.min(3,Number(work.width)||1)));
  $('heightInput').value=String(Math.max(1,Math.min(3,Number(work.height)||1)));
  $('fullProjectInput').checked=!!work.showFullProject;
  const box=$('categoryChecks');box.innerHTML='';
  data.categories.forEach(cat=>{
    const label=document.createElement('label');
    const checked=(work.categoryIds||[]).includes(cat.id);
    label.innerHTML='<input type="checkbox" value="'+escapeHtml(cat.id)+'" '+(checked?'checked':'')+'><span>'+escapeHtml(cat.name)+'</span>';
    label.querySelector('input').addEventListener('change',()=>{
      work.categoryIds=[...box.querySelectorAll('input:checked')].map(i=>i.value);
      saveQuiet();renderPreview();showToast('Категории сохранены');
    });
    box.append(label);
  });
}
function renderBrandEditor(brand){
  $('brandEditorTitle').textContent=brand.name||'Без названия';
  $('brandNameInput').value=brand.name||'';
  $('brandSrcInput').value=brand.src||'';
  $('brandPreviewImage').src=mediaUrl(brand.src);
}
function updateWork(key,value,mirrorRu=false){
  const work=selectedWork();if(!work)return;
  work[key]=value;
  if(mirrorRu&&Object.prototype.hasOwnProperty.call(work,key+'Ru'))work[key+'Ru']=value;
  saveQuiet();renderWorkList();renderPreview();
  $('editorTitle').textContent=work.title||'Без названия';
}
function updateBrand(key,value){
  const brand=selectedBrand();if(!brand)return;
  brand[key]=value;saveQuiet();renderBrandList();
  $('brandEditorTitle').textContent=brand.name||'Без названия';
  $('brandPreviewImage').src=mediaUrl(brand.src);
}
function addWork(){
  const item={
    id:uuid(),title:'New project',titleRu:'Новый проект',type:'Design',typeRu:'Дизайн',
    description:'',descriptionRu:'',body:'',bodyRu:'',src:'',mediaType:'image',
    projectMedia:[],width:1,height:1,showFullProject:false,categoryIds:[]
  };
  data.works.push(item);selectedWorkId=item.id;selectedBrandId=null;currentTab='works';saveQuiet();renderAll();showToast('Проект добавлен');
}
function addBrand(){
  const item={id:uuid(),name:'Новый бренд',src:''};
  data.brands.push(item);selectedBrandId=item.id;selectedWorkId=null;currentTab='brands';saveQuiet();renderAll();showToast('Бренд добавлен');
}
function deleteWork(){
  const work=selectedWork();if(!work)return;
  if(!confirm('Удалить проект «'+(work.title||'Без названия')+'» из черновика?'))return;
  const i=data.works.findIndex(w=>w.id===work.id);data.works.splice(i,1);
  selectedWorkId=data.works[Math.min(i,data.works.length-1)]?.id||null;saveQuiet();renderAll();showToast('Проект удалён из черновика');
}
function deleteBrand(){
  const brand=selectedBrand();if(!brand)return;
  if(!confirm('Удалить бренд «'+(brand.name||'Без названия')+'» из черновика?'))return;
  const i=data.brands.findIndex(b=>b.id===brand.id);data.brands.splice(i,1);
  selectedBrandId=data.brands[Math.min(i,data.brands.length-1)]?.id||null;saveQuiet();renderAll();showToast('Бренд удалён из черновика');
}
function exportJson(){
  const copy=clone(data);copy.revision=Math.max(Number(copy.revision)||0,1)+1;
  const blob=new Blob([JSON.stringify(copy,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='content-admin-preview.json';a.click();URL.revokeObjectURL(url);
  showToast('JSON скачан');
}
async function resetDraft(){
  if(!confirm('Удалить локальный черновик и снова загрузить content.json из ветки?'))return;
  localStorage.removeItem(DRAFT_KEY);data=null;selectedWorkId=null;selectedBrandId=null;await load();
}

document.querySelectorAll('.tab').forEach(button=>button.addEventListener('click',()=>{
  currentTab=button.dataset.tab;
  if(currentTab==='works'){selectedBrandId=null;selectedWorkId=selectedWorkId||data.works[0]?.id||null}
  else{selectedWorkId=null;selectedBrandId=selectedBrandId||data.brands[0]?.id||null}
  renderAll();
}));
$('addWorkBtn').addEventListener('click',addWork);
$('addBrandBtn').addEventListener('click',addBrand);
$('deleteWorkBtn').addEventListener('click',deleteWork);
$('deleteBrandBtn').addEventListener('click',deleteBrand);
$('exportBtn').addEventListener('click',exportJson);
$('resetBtn').addEventListener('click',resetDraft);
$('preview-size').addEventListener('change',e=>{
  $('previewShell').className='preview-shell '+e.target.value;
});

$('titleInput').addEventListener('input',e=>updateWork('title',e.target.value,true));
$('descriptionInput').addEventListener('input',e=>updateWork('description',e.target.value,true));
$('srcInput').addEventListener('change',e=>{updateWork('src',e.target.value);renderInspector()});
$('mediaTypeInput').addEventListener('change',e=>updateWork('mediaType',e.target.value));
$('mediaFitInput').addEventListener('change',e=>updateWork('mediaFit',e.target.value));
$('widthInput').addEventListener('change',e=>updateWork('width',Number(e.target.value)));
$('heightInput').addEventListener('change',e=>updateWork('height',Number(e.target.value)));
$('fullProjectInput').addEventListener('change',e=>updateWork('showFullProject',e.target.checked));
$('brandNameInput').addEventListener('input',e=>updateBrand('name',e.target.value));
$('brandSrcInput').addEventListener('change',e=>updateBrand('src',e.target.value));

window.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveDraft()}
});

load().catch(error=>{
  console.error(error);
  $('galleryPreview').innerHTML='<div style="padding:24px;color:#f3b6b6">'+escapeHtml(error.message)+'</div>';
});
