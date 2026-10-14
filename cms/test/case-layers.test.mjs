import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../../admin-cms/admin.js',import.meta.url),'utf8');
const source=code.slice(code.indexOf('function reorderCaseLayers('),code.indexOf('function renderInspector('));
function harness(ids=['a','b','c','d','e'],selected=['b','d'],layout='free'){
 const blocks=ids.map((id,i)=>({id,kind:'image',src:'/'+id+'.png',frame:{x:10,y:20,w:300,h:200},text:id}));
 const w={blocks,caseLayout:layout},history=[],chosen=new Set(selected),selections=[];
 function node(tag,text,cls){return{tag,text,cls,children:[],dataset:{},attributes:{},append(...items){this.children.push(...items);},setAttribute(k,v){this.attributes[k]=v;}};}
 const ctx={work:()=>w,caseSelection:()=>w.blocks.filter(b=>chosen.has(b.id)),gesture:null,saving:false,snapshot:()=>history.push(structuredClone(w)),mark(){},renderCase(){},renderInspector(){},make:node,button:(text,fn,cls)=>Object.assign(node('button',text,cls),{onclick:fn}),lang:'en',selectedBlocks:chosen,blockId:selected[0],selectBlock:(id,extend)=>selections.push({id,extend})};
 vm.runInNewContext(source+';globalThis.move=reorderCaseLayers;globalThis.layers=renderCaseLayers;',ctx);
 return{w,history,ctx,node,selections};
}
test('layer operations preserve group order, media and exact frames with one undo snapshot',()=>{
 const cases={front:'acebd',back:'bdace',forward:'acbed',backward:'badce'};
 for(const [action,expected]of Object.entries(cases)){
  const h=harness(),original=new Map(h.w.blocks.map(b=>[b.id,JSON.stringify(b)]));h.ctx.move(action);
  assert.equal(h.w.blocks.map(b=>b.id).join(''),expected);assert.equal(h.history.length,1);assert.equal(h.history[0].blocks.map(b=>b.id).join(''),'abcde');
  for(const b of h.w.blocks)assert.equal(JSON.stringify(b),original.get(b.id));
 }
});
test('contiguous group moves one level as a group; boundary no-op does not create history',()=>{
 const h=harness(['a','b','c','d'],['b','c']);h.ctx.move('forward');assert.equal(h.w.blocks.map(b=>b.id).join(''),'adbc');h.ctx.move('forward');assert.equal(h.history.length,1);
 const all=harness(['a','b'],['a','b']);for(const action of ['front','back','forward','backward'])all.ctx.move(action);assert.equal(all.history.length,0);
 const empty=harness(['a'],[]);empty.ctx.move('front');assert.equal(empty.history.length,0);
});
test('layer selection exposes covered blocks without mutating document and supports Shift',()=>{
 for(const layout of ['free','flow']){const h=harness(['a','b','c'],['b'],layout),before=JSON.stringify(h.w),box=h.node('aside');h.ctx.layers(box);const panel=box.children[0],list=panel.children[1];
  assert.equal(list.children.map(n=>n.dataset.layerId).join(''),layout==='free'?'cba':'abc');assert.equal(list.children.find(n=>n.dataset.layerId==='b').attributes['aria-pressed'],'true');
  list.children[0].onclick({shiftKey:true});assert.deepEqual(h.selections,[{id:layout==='free'?'c':'a',extend:true}]);assert.equal(JSON.stringify(h.w),before);assert.equal(h.history.length,0);
 }
});
test('layers render untrusted captions as text and offer flow-specific ordering',()=>{
 const h=harness(['a'],[],'flow');h.w.blocks[0].text='<img src=x onerror=alert(1)>';const box=h.node('aside');h.ctx.layers(box);const panel=box.children[0];
 assert.equal(panel.children[1].children[0].text,'Фото · <img src=x onerror=alert(1)>');assert.equal(panel.children[1].children[0].innerHTML,undefined);
 assert.deepEqual(panel.children[2].children.map(n=>n.text),['Выше','Ниже','В начало','В конец']);assert.ok(panel.children[2].children.every(n=>n.disabled));
});
