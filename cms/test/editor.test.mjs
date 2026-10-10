import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,readdir} from 'node:fs/promises';
const read=path=>readFile(new URL('../../'+path,import.meta.url),'utf8');
test('floating-add regression: renderAll runs against actual prototype HTML IDs',async()=>{
 const html=await read('admin-preview-v60/index.html'),js=await read('admin-preview-v60/admin.js');const ids=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],{}]));
 const body=js.match(/function renderAll\(\)\{([^\n]+)\}/)[1];
 for(const currentTab of ['works','brands']){vm.runInNewContext('('+`function renderAll(){${body}}`+')()',{currentTab,$:id=>ids.get(id),document:{querySelectorAll:()=>[]},renderFrame(){},renderBrands(){},renderInspector(){}});assert.equal(ids.get('addWorkBtn').hidden,currentTab!=='works');}
});
test('ported editor static controls are present and scripts parse',async()=>{
 const html=await read('admin-cms/index.html'),js=await read('admin-cms/admin.js');const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));const dynamic=new Set(['mosaic-settings','category-editor']);
 for(const m of js.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.has(m[1])||dynamic.has(m[1]),'Missing UI control '+m[1]);
 for(const file of await readdir(new URL('../../admin-cms/',import.meta.url)))if(file.endsWith('.js'))new vm.Script(await read('admin-cms/'+file),{filename:file});
 assert.ok(!js.includes("w[key+'Ru']=w[key]"));assert.ok(!(await read('admin-cms/case-renderer.js')).includes("obj[key+'Ru']=node.innerText"));
});
test('shared gallery packer and ALIGN execute with no intersecting original cards',async()=>{
 const context={window:{},document:{},Map,Set,Math,Number,structuredClone};vm.runInNewContext(await read('mosaic-layout.js'),context);
 const layout=context.window.MosaicLayout;assert.equal(typeof layout.packRows,'function');assert.equal(typeof layout.proportionalSize,'function');
 const content=JSON.parse(await read('content.json'));const packed=layout.pack(content.works,1200,16);assert.equal(packed.length,content.works.length);for(let i=0;i<packed.length;i++)for(let j=i+1;j<packed.length;j++){const a=packed[i],b=packed[j];assert.ok(a.row+a.height<=b.row+.01||b.row+b.height<=a.row+.01||a.start+a.span<=b.start||b.start+b.span<=a.start,'overlap');}
 const spanning=layout.packRows(Array.from({length:12},(_,i)=>({id:String(i),src:'/x.png',cardW:200,cardH:300,rowSpan:i===0?3:1})),[{count:5,height:300}]);assert.equal(spanning.items.length,12);assert.equal(spanning.items[0].rows,3);for(let i=0;i<spanning.items.length;i++)for(let j=i+1;j<spanning.items.length;j++){const a=spanning.items[i],b=spanning.items[j];assert.ok(a.row+a.rows<=b.row||b.row+b.rows<=a.row||a.x+a.w<=b.x||b.x+b.w<=a.x,'span overlap');}
 const size=layout.proportionalSize(600,300,120,60,'se');assert.equal(size.width/size.height,2);
 vm.runInNewContext(await read('admin-cms/case-tools.js'),context);const blocks=[{frame:{x:10,y:20,w:100,h:100}},{frame:{x:210,y:150,w:100,h:100}}];assert.equal(context.window.CaseTools.align(blocks,'top',500),true);assert.equal(blocks[0].frame.y,blocks[1].frame.y);
});
