import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../../admin-cms/case-renderer.js',import.meta.url),'utf8');
class Element {
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.style={setProperty(k,v){this[k]=v;}};this.events={};this.className='';this.classList={add:c=>{this.className+=' '+c;},contains:c=>this.className.split(' ').includes(c),toggle(){}};}
 append(...nodes){this.children.push(...nodes);}
 addEventListener(name,fn){this.events[name]=fn;}
 querySelector(selector){return this.descendants().find(n=>selector.startsWith('.')?n.className.split(' ').includes(selector.slice(1)):n.dataset.blockId===selector.match(/"(.*?)"/)?.[1])||null;}
 descendants(){return this.children.flatMap(n=>[n,...n.descendants()]);}
}
for(const kind of ['image','video'])test(`${kind} metadata and rerenders preserve saved free-case geometry`,()=>{
 const ctx={window:{},document:{createElement:tag=>new Element(tag)},structuredClone,queueMicrotask,crypto:{randomUUID:()=>Math.random().toString()}};
 vm.runInNewContext(source,ctx);const renderer=ctx.window.CaseRenderer;
 const work={title:'Example',caseLayout:'free',blocks:[{id:'media',kind,src:'/asset',frame:{x:20,y:40,w:600,h:600}},{id:'text',kind:'text',text:'Caption',frame:{x:20,y:670,w:600,h:100}}]};
 const before=JSON.stringify(work);let changes=0;
 const root=renderer.render(work,'en',{edit:true,onChange:()=>changes++}),asset=root.querySelector('.case-block-media');
 asset[kind==='image'?'naturalWidth':'videoWidth']=1920;asset[kind==='image'?'naturalHeight':'videoHeight']=1080;
 asset.events[kind==='image'?'load':'loadedmetadata']();
 assert.equal(JSON.stringify(work),before);assert.equal(changes,0);
 renderer.render(work,'en',{edit:true,onChange:()=>changes++});
 assert.equal(JSON.stringify(work),before,'cached media dimensions must not alter a reopened case');
 renderer.nativeSize(work.blocks[0]);
 assert.equal(work.blocks[0].frame.h,337.5,'explicit fit command may change the selected block');
 assert.equal(work.blocks[1].frame.y,670,'fit must not shift neighbouring blocks');
 work.blocks[0].mediaMode='crop';work.blocks[0].frame.h=450;
 renderer.nativeSize(work.blocks[0]);assert.equal(work.blocks[0].frame.h,450);
});
