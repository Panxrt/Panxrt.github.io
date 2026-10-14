import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const uploads=await readFile(new URL('../../admin-cms/uploads.js',import.meta.url),'utf8');
const editor=await readFile(new URL('../../admin-cms/admin.js',import.meta.url),'utf8');
function node(){return {children:[],append(...nodes){this.children.push(...nodes);nodes.forEach(n=>n.parent=this);},remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}};}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function harness(){
 const nodes={uploads:node(),'upload-list':node()},requests=[],timers=[];let complete=0,finishes=0;
 class XHR{upload={};open(){}setRequestHeader(k,v){(this.headers??={})[k]=v;}send(body){this.body=body;requests.push(this);}abort(){this.onabort();}ok(offset){this.status=200;this.responseText=JSON.stringify({offset});this.onload();}}
 const context={document:{createElement:node,getElementById:id=>nodes[id]},window:{},XMLHttpRequest:XHR,alert(){},setTimeout:fn=>timers.push(fn),CMS:{uploadHeaders:async()=>({'X-CSRF-Token':'test'}),api:async(path)=>{if(path.endsWith('/status'))return{configured:true};if(path.endsWith('/start'))return{ticket:'private-test',chunk:4,offset:0};if(path.endsWith('/finish')){finishes++;return{src:'/api/media/file/test.png',mediaType:'image'};}throw Error(path);}}};
 vm.runInNewContext(uploads,context);
 return {api:context.window.Uploads,nodes,requests,timers,file:{name:'image.png',type:'image/png',size:8,slice:(a,b)=>({a,b})},done:()=>complete++,get completed(){return complete;},get finishes(){return finishes;}};
}
test('pause aborts current chunk; resume retries same offset; completion dismisses notice',async()=>{
 const h=harness();assert.equal(h.api.start(h.file,h.done),true);await settle();const row=h.nodes['upload-list'].children[0],pause=row.children[3];
 pause.onclick();await settle();assert.equal(h.requests.length,1);assert.equal(h.api.pending,true);assert.equal(h.completed,0);
 pause.onclick();await settle();assert.equal(h.requests[1].headers['X-Upload-Offset'],'0');h.requests[1].ok(4);await settle();assert.equal(h.requests[2].headers['X-Upload-Offset'],'4');h.requests[2].ok(8);await settle();
 assert.equal(h.completed,1);assert.equal(h.finishes,1);assert.equal(h.api.pending,false);h.timers[0]();assert.equal(h.nodes.uploads.hidden,true);
});
test('cancel aborts upload and cannot apply a late completion',async()=>{
 const h=harness();h.api.start(h.file,h.done);await settle();h.nodes['upload-list'].children[0].children[4].onclick();await settle();
 assert.equal(h.api.pending,false);assert.equal(h.completed,0);assert.equal(h.finishes,0);assert.equal(h.nodes.uploads.hidden,true);
});
test('network failure preserves offset and supports explicit retry',async()=>{
 const h=harness();h.api.start(h.file,h.done);await settle();h.requests[0].ok(4);await settle();h.requests[1].onerror();await settle();
 const row=h.nodes['upload-list'].children[0];assert.equal(row.children[3].textContent,'Продолжить');row.children[3].onclick();await settle();assert.equal(h.requests[2].headers['X-Upload-Offset'],'4');h.requests[2].ok(8);await settle();assert.equal(h.completed,1);
});
test('rejected upload does not create a job; stale completion is not advertised as saved',async()=>{
 const h=harness();assert.equal(h.api.start({...h.file,size:0},h.done),false);assert.equal(h.api.pending,false);
 h.api.start(h.file,()=>false);await settle();h.requests[0].ok(4);await settle();h.requests[1].ok(8);await settle();assert.match(h.nodes['upload-list'].children[0].children[2].textContent,/не применён/);assert.equal(h.api.pending,false);
});
function fieldHarness(){
 const target={id:'a',src:'/old.png'},callbacks=[],parent=node();let current=target,snapshots=0,marks=0;
 const ctx={make:node,Uploads:{start(file,fn){callbacks.push(fn);return true;}},snapshot:()=>snapshots++,mark:()=>marks++,message(){},renderCanvas(){},renderInspector(){}};
 const source=editor.slice(editor.indexOf('const mediaUploadVersions='),editor.indexOf('function media('));vm.runInNewContext(source+';globalThis.field=uploadField;',ctx);
 ctx.field(parent,()=>current);const input=parent.children[0].children[0];input.files=[{name:'new.png'}];
 return{target,callbacks,start:()=>input.onchange(),replace:x=>current=x,get snapshots(){return snapshots;},get marks(){return marks;}};
}
test('only latest upload can update a card, with one undo entry',()=>{
 const h=fieldHarness();h.start();h.start();const result={src:'/new.png',mediaType:'image'};
 assert.equal(h.callbacks[0](result),false);assert.equal(h.target.src,'/old.png');assert.equal(h.snapshots,0);
 assert.equal(h.callbacks[1](result),true);assert.equal(h.target.src,'/new.png');assert.equal(h.snapshots,1);assert.equal(h.marks,1);
});
test('deleted, restored or manually replaced media cannot receive stale upload',()=>{
 for(const change of ['deleted','restored','edited']){const h=fieldHarness();h.start();if(change==='deleted')h.replace(null);if(change==='restored')h.replace({...h.target});if(change==='edited')h.target.src='/manual.png';assert.equal(h.callbacks[0]({src:'/late.png',mediaType:'image'}),false);assert.equal(h.snapshots,0);assert.equal(h.marks,0);}
});
test('pending uploads block test publication, reload and logout before network requests',async()=>{
 for(const id of ['publish-test','reload-draft','logout']){const start=editor.indexOf(`$('${id}').onclick=`),source=editor.slice(start,editor.indexOf('\n',start)),control={};let message='';const ctx={$:()=>control,Uploads:{pending:true},message:s=>message=s};vm.runInNewContext(source,ctx);await control.onclick();assert.match(message,/загрузки/);}
});
