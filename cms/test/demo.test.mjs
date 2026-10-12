import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const root=new URL('../../',import.meta.url);
test('standalone editor builds with inline scripts and no private CMS transport',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'panxrt-demo-'));try{const output=join(dir,'demo.html');execFileSync(process.execPath,[new URL('../build-editor-demo.mjs',import.meta.url).pathname,output]);const html=await readFile(output,'utf8');assert.ok(!html.includes('src="/admin-cms/'));assert.ok(!html.includes('GITHUB_CLIENT_SECRET'));assert.ok(!html.includes("api('/api/draft'"));assert.ok(html.includes('ЛОКАЛЬНЫЙ РЕДАКТОР'));let count=0;for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)){new vm.Script(m[1]);count++;}assert.equal(count,6);}finally{await rm(dir,{recursive:true,force:true});}
});
test('row controls add/remove settings without deleting works; numeric edits do not rebuild focused inputs',async()=>{
 const code=await readFile(new URL('admin-cms/admin.js',root),'utf8');const controls=code.slice(code.indexOf('function renderLayoutControls(){'),code.indexOf('\nfunction renderGallery()'));
 const data={works:[{id:'a'},{id:'b'}],galleryLayout:{rows:[{count:2,height:300}]}};let renders=0,snapshots=0;const fields={},buttons={};const context={data,selectedRow:0,currentRows:()=>data.galleryLayout.rows,$:()=>({replaceChildren(){},append(){}}),field:(box,label,obj,key,options)=>{fields[label]={obj,key,options};},button:(label,fn)=>buttons[label]={fn},enableRows(){},snapshot(){snapshots++;},mark(){},resizeCanvas(){renders++;},renderGallery(){},confirm:()=>true,Math};vm.runInNewContext(controls+';renderLayoutControls();',context);
 fields['Высота ряда'].obj.height=450;fields['Высота ряда'].options.change();assert.equal(data.galleryLayout.rows[0].height,450);assert.equal(renders,1);
 buttons['＋ Ряд'].fn();assert.equal(data.galleryLayout.rows.length,2);buttons['Убрать ряд'].fn();assert.equal(data.galleryLayout.rows.length,1);assert.equal(data.works.length,2);assert.equal(snapshots,2);
});
