import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../../admin-cms/admin.js',import.meta.url),'utf8');
test('opening an existing or legacy case does not mutate content or create undo entries',()=>{
 const source=code.slice(code.indexOf('function openCase(){'),code.indexOf('\nasync function restoreMediaRatio'));
 for(const work of [{id:'legacy',src:'/cover.png'},{id:'current',blocks:[],caseLayout:'flow'}]){
  const before=JSON.stringify(work);let renders=0;
  const ctx={work:()=>work,caseId:null,blockId:'old',selectedBlocks:new Set(['old']),render:()=>renders++,window:{scrollTo(){}},snapshot:()=>assert.fail('opening must not snapshot'),mark:()=>assert.fail('opening must not mark dirty')};
  vm.runInNewContext(source+';openCase();',ctx);assert.equal(JSON.stringify(work),before);assert.equal(ctx.caseId,work.id);assert.equal(ctx.blockId,null);assert.equal(ctx.selectedBlocks.size,0);assert.equal(renders,1);
 }
});
test('moving a row keeps cards and row geometry together and is undoable',()=>{
 const source=code.slice(code.indexOf('function moveGalleryRow('),code.indexOf('function renderLayoutControls(){'));
 const works=['a','b','c','d','e'].map(id=>({id})),rows=[{count:2,height:200},{count:1,height:350},{count:2,height:450}];
 let snapshots=0,changes=0;
 const ctx={data:{works,galleryLayout:{rows}},selectedRow:0,currentRows:()=>rows,$:()=>({value:'desktop',_mosaicItems:works.map((w,i)=>({id:w.id,row:i<2?1:i===2?2:3}))}),MosaicLayout:{ordered:w=>[...w]},snapshot:()=>snapshots++,enableRows(){},mark:()=>changes++,renderGallery(){},renderInspector(){},message:()=>assert.fail('valid rows rejected')};
 vm.runInNewContext(source+';moveGalleryRow(1);',ctx);assert.equal(ctx.data.works.map(w=>w.id).join(','),'c,a,b,d,e');assert.equal(rows[0].height,350);assert.equal(rows[1].height,200);assert.equal(ctx.selectedRow,1);assert.equal(snapshots,1);assert.equal(changes,1);
});
test('row movement refuses intersecting spans without mutating the document',()=>{
 const source=code.slice(code.indexOf('function moveGalleryRow('),code.indexOf('function renderLayoutControls(){'));
 const data={works:[{id:'a',rowSpan:2},{id:'b'}],galleryLayout:{rows:[{count:1,height:200},{count:2,height:300}]}};const before=JSON.stringify(data);let warning='';
 const ctx={data,selectedRow:0,currentRows:()=>data.galleryLayout.rows,$:()=>({value:'desktop',_mosaicItems:[{id:'a',row:1},{id:'b',row:2}]}),snapshot:()=>assert.fail('invalid move must not snapshot'),message:m=>warning=m};
 vm.runInNewContext(source+';moveGalleryRow(1);',ctx);assert.equal(JSON.stringify(data),before);assert.ok(warning.includes('одного ряда'));
});
