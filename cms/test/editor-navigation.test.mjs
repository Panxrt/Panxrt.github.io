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

test('moving one card to a chosen row updates membership and counts without losing works',()=>{
 const source=code.slice(code.indexOf('function moveCardToRow('),code.indexOf('function renderLayoutControls(){'));
 for(const initial of [[['a','b'],['c','d']],[['a'],['c','d']]]){
  const works=initial.flat().map(id=>({id})),rows=initial.map(ids=>({count:ids.length,height:300}));let snapshots=0;
  const ctx={data:{works,galleryLayout:{rows}},selectedRow:0,selectedId:null,currentRows:()=>rows,$:()=>({value:'desktop',_mosaicItems:initial.flatMap((ids,i)=>ids.map(id=>({id,row:i+1})))}),snapshot:()=>snapshots++,mark(){},renderGallery(){},renderInspector(){},message:()=>assert.fail('valid move rejected')};
  vm.runInNewContext(source+";moveCardToRow('a',1);",ctx);
  assert.equal(ctx.data.works.map(w=>w.id).join(','),initial[0].length===2?'b,c,d,a':'c,d,a');
  assert.equal(ctx.data.galleryLayout.rows.at(-1).count,3);assert.equal(ctx.data.galleryLayout.rows.length,initial[0].length===2?2:1);assert.equal(snapshots,1);assert.equal(ctx.selectedId,'a');
 }
});

test('undo and redo restore exact case data without generating blocks or frames',()=>{
 const source=code.slice(code.indexOf('function restoreHistory('),code.indexOf("$('undo').onclick="));
 const original={revision:1,works:[{id:'a',src:'/a.png'}]},edited={revision:2,works:[{id:'a',blocks:[{id:'b',kind:'image',frame:{x:4,y:80,w:200,h:300}}]}]};
 const controls={undo:{},redo:{}};
 const ctx={data:structuredClone(edited),caseId:'a',blockId:'b',gesture:null,saving:false,selectedBlocks:new Set(['b']),historyStack:[JSON.stringify(original)],redoStack:[],work:()=>true,mark(){},render(){},$:id=>controls[id]};
 vm.runInNewContext(source+';restoreHistory(historyStack,redoStack);',ctx);
 assert.equal(ctx.data.revision,2);assert.equal(ctx.data.works[0].blocks,undefined);assert.equal(controls.undo.disabled,true);assert.equal(controls.redo.disabled,false);
 vm.runInNewContext('restoreHistory(redoStack,historyStack);',ctx);assert.equal(JSON.stringify(ctx.data),JSON.stringify(edited));
});

test('card pointer selection preserves redo and resize snapshots only after movement',()=>{
 const source=code.slice(code.indexOf("area.addEventListener('pointerdown'"),code.indexOf('function endGesture('));
 const callbacks={},card={id:'a',cardW:400,cardH:300,resizeMode:'free'};let snapshots=0,changes=0;
 const grid={clientWidth:1200,querySelector:()=>null};
 const ctx={area:{addEventListener:(event,fn)=>callbacks[event]=fn,setPointerCapture(){}},preview:false,gesture:null,data:{works:[card]},selectedId:null,
  $:()=>grid,MosaicLayout:{apply:()=>1200},snapshot:()=>snapshots++,renderInspector(){},queueGallery(){},mark:()=>changes++,window:{scrollY:0},document:{body:{classList:{add(){}}}}};
 vm.runInNewContext(source,ctx);
 const handle={dataset:{kind:'card',resize:'e',id:'a'}},event=(x)=>({target:{closest:()=>handle},button:0,clientX:x,clientY:20,pointerId:1,preventDefault(){}});
 callbacks.pointerdown(event(10));assert.equal(snapshots,0);assert.equal(ctx.selectedId,'a');
 callbacks.pointermove(event(12));assert.equal(snapshots,0);assert.equal(changes,0);
 callbacks.pointermove(event(30));callbacks.pointermove(event(40));
 assert.equal(snapshots,1);assert.equal(card.cardW,430);assert.equal(changes,2);
});
