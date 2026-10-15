import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../../admin-cms/admin.js',import.meta.url),'utf8');
const source=code.slice(code.indexOf('function editCaseSelection('),code.indexOf('function reorderCaseLayers('));
function harness(layout='free'){
 const w={caseLayout:layout,blocks:[{id:'a',kind:'image',src:'/a',frame:{x:20,y:30,w:200,h:100}},{id:'b',kind:'text',text:'EN',textRu:'RU',frame:{x:800,y:40,w:400,h:100}},{id:'c',kind:'video',src:'/c',frame:{x:0,y:200,w:100,h:100}}]},selection=new Set(['a','b']),history=[],events={};let serial=0;
 const ctx={caseId:'project',preview:false,gesture:null,saving:false,work:()=>w,selectedBlocks:selection,blockId:'b',caseSelection:()=>w.blocks.filter(b=>selection.has(b.id)),confirm:()=>true,snapshot:()=>history.push(structuredClone(w)),structuredClone,crypto:{randomUUID:()=>`copy-${++serial}`},mark(){},renderCase(){},renderInspector(){},stageHeight(){},$:()=>({querySelector:()=>null}),document:{addEventListener:(key,fn)=>events[key]=fn},window:{addEventListener:(key,fn)=>events[key]=fn}};
 vm.runInNewContext(source+';globalThis.edit=editCaseSelection;globalThis.nudge=nudgeCaseSelection;',ctx);
 const key=(key,extra={})=>{let prevented=false;events.keydown({key,ctrlKey:false,metaKey:false,repeat:false,shiftKey:false,altKey:false,target:{closest:()=>false},preventDefault:()=>prevented=true,...extra});return prevented;};
 return{w,selection,history,ctx,events,key};
}
test('duplicate preserves group geometry, media and languages; creates unique selected copies and one undo',()=>{
 const h=harness(),original=structuredClone(h.w);h.ctx.edit('duplicate');assert.equal(h.history.length,1);assert.equal(h.w.blocks.map(b=>b.id).join(','),'a,b,copy-1,copy-2,c');
 for(let i=0;i<2;i++){const copy=h.w.blocks[i+2],old=original.blocks[i];assert.equal(copy.frame.x,old.frame.x);assert.equal(copy.frame.y,old.frame.y+20);assert.equal(copy.src,old.src);assert.equal(copy.textRu,old.textRu);assert.deepEqual(h.w.blocks[i],old);}
 assert.deepEqual([...h.selection],['copy-1','copy-2']);assert.deepEqual(h.history[0],original);
});
test('flow duplicates do not change stored frames; delete affects only selected blocks',()=>{
 const h=harness('flow');h.ctx.edit('duplicate');assert.deepEqual(h.w.blocks[2].frame,h.w.blocks[0].frame);h.ctx.edit('delete');assert.equal(h.w.blocks.map(b=>b.id).join(','),'a,b,c');assert.equal(h.history.length,2);assert.equal(h.selection.size,0);
});
test('cancelled deletion, preview and active gestures cannot change content',()=>{
 for(const flag of ['cancel','preview','gesture','saving']){const h=harness(),before=JSON.stringify(h.w);if(flag==='cancel')h.ctx.confirm=()=>false;else h.ctx[flag]=true;h.ctx.edit('delete');assert.equal(JSON.stringify(h.w),before);assert.equal(h.history.length,0);}
});
test('arrow and Shift+arrow move selection together within bounds; held key creates one undo entry',()=>{
 const h=harness();assert.equal(h.key('ArrowRight'),true);assert.equal(h.history.length,0); // group already touches right edge
 h.key('ArrowLeft');h.key('ArrowLeft',{repeat:true});assert.equal(h.history.length,1);assert.equal(h.w.blocks[0].frame.x,18);assert.equal(h.w.blocks[1].frame.x,798);
 h.events.keyup({key:'ArrowLeft'});h.key('ArrowUp',{shiftKey:true});assert.equal(h.history.length,2);assert.equal(h.w.blocks[0].frame.y,20);assert.equal(h.w.blocks[1].frame.y,30);
 for(let i=0;i<5;i++)h.key('ArrowUp',{repeat:true,shiftKey:true});assert.equal(h.history.length,2);assert.equal(h.w.blocks[0].frame.y,0);assert.equal(h.w.blocks[1].frame.y,10);
});
test('shortcuts preserve typing, video controls, modifiers and flow scrolling',()=>{
 for(const key of ['ArrowLeft','Delete','d']){const h=harness();assert.equal(h.key(key,{ctrlKey:key==='d',target:{closest:()=>true}}),false);assert.equal(h.history.length,0);}
 const h=harness();assert.equal(h.key('d',{ctrlKey:true}),true);assert.equal(h.history.length,1);h.key('d',{ctrlKey:true,repeat:true});assert.equal(h.history.length,1);
 const flow=harness('flow');assert.equal(flow.key('ArrowDown'),false);assert.equal(flow.history.length,0);
});
