// Standalone, local-only editor. Public snapshot only; no auth or private APIs.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFile(resolve(root,p),'utf8');
const json=JSON.parse(await read('content.json'));
function urls(value){if(Array.isArray(value))return value.map(urls);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,typeof v==='string'&&['src','poster','cover','image','video'].includes(k)&&v&&!/^(https?:|data:|blob:)/i.test(v)?new URL(v,'https://panxrt.win/').href:urls(v)]));return value;}
const serialize=v=>JSON.stringify(v).replace(/</g,'\\u003c');
const runtime=`
const DEMO_SEED=${serialize(urls(json))};
window.CMS=(()=>{const key='panxrt-editor-demo-v1';let versions=[];return {
 async load(){let saved;try{saved=localStorage.getItem(key);}catch{}return saved?JSON.parse(saved):structuredClone(DEMO_SEED);},
 async save(data){const copy=structuredClone(data);copy.revision=(copy.revision||0)+1;try{localStorage.setItem(key,JSON.stringify(copy));}catch{throw Error('Браузер не смог сохранить копию. Нажмите «Скачать копию».');}versions.push({sha:String(versions.length),date:new Date().toLocaleString(),message:'Локальная копия',data:copy});return {data:copy};},
 async versions(){return versions.slice().reverse();},async restore(id){const item=versions.find(v=>v.sha===id);if(!item)throw Error('Версия недоступна');await this.save(item.data);return structuredClone(item.data);},
 async publish(){throw Error('В автономном редакторе нет публикации.');},async logout(){}
};})();
window.Uploads={pending:false,start(){alert('В этой версии укажите URL файла. Исходные медиа не изменяются.');}};
`;
let html=await read('admin-cms/index.html');
html=html.replace(/<link[^>]+rel="stylesheet"[^>]*>/g,'').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
html=html.replace('PRIVATE CMS · тестовое окружение · публичный сайт не изменяется','ЛОКАЛЬНЫЙ РЕДАКТОР · изменения только в этом браузере · сайт не изменяется');
html=html.replace('href="/" target="_blank"','href="https://panxrt.win/" target="_blank"');
html=html.replace('Вход через GitHub App. Пароль GitHub здесь не хранится и не меняется.','Автономная версия: вход не нужен, соединения с приватным хранилищем нет.');
html=html.replace('Сохранение — в приватный репозиторий. Публикация TEST не меняет panxrt.win.','Сохранение — в этом браузере. Используйте «Скачать копию», чтобы сохранить JSON на компьютер.');
let admin=await read('admin-cms/admin.js');
admin=admin.replaceAll('Приватный черновик','Локальный макет').replaceAll('приватного черновика','локального макета').replaceAll('удалённой версии','локальной версии').replaceAll('Удалённой версии','Локальной версии');
const scripts=[await read('mosaic-layout.js'),await read('admin-cms/case-renderer.js'),runtime,await read('admin-cms/case-tools.js'),admin,`
for(const id of ['publish-test','logout','open-preview'])document.getElementById(id).hidden=true;
document.getElementById('save').textContent='Сохранить в браузере';
document.getElementById('reload-draft').textContent='Открыть сохранённое';
const importButton=make('button','Открыть JSON');document.getElementById('download-draft').after(importButton);
importButton.onclick=()=>{const input=make('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{try{const next=JSON.parse(await input.files[0].text());if(!Array.isArray(next.works)||!Array.isArray(next.brands))throw Error('Нужен JSON портфолио');for(const w of next.works){if(!w.id)throw Error('У работы отсутствует id');for(const media of [w,...(w.blocks||[])])if(media.src&&!/^(https?:|data:image\\/|data:video\\/|blob:)/i.test(media.src))throw Error('Используйте полный HTTPS URL медиа');}if(dirty&&!confirm('Заменить текущие несохранённые правки?'))return;snapshot();data=next;caseId=blockId=selectedId=null;selectedBlocks.clear();mark();render();message('JSON открыт. Сайт не изменён.');}catch(e){message(e.message,true);}};input.click();};
`];
const css=await read('admin-cms/admin.css')+'\n'+await read('admin-cms/case-renderer.css')+`\n.editor-header{height:auto;min-height:74px;flex-wrap:wrap;position:relative;gap:8px}.editor-toolbar{position:relative;top:0;flex-wrap:wrap}.mosaic-settings{display:flex;flex-wrap:wrap;gap:8px;align-items:end}.mosaic-settings label{max-width:115px}.editor-header #status{flex-basis:100%;max-width:none}.editor-toolbar>div{flex-wrap:wrap}[hidden]{display:none!important}#inspector{top:0;height:100vh}.cms-test-banner{padding:10px 22px;background:#342c44;font-size:12px}`;
html=html.replace('</head>','<style>'+css+'</style></head>').replace('</body>',scripts.map(s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>').join('\n')+'</body>');
const output=resolve(process.argv[2]||resolve(root,'PANXRT-Editor-Demo.html'));await writeFile(output,html);console.log(output);
