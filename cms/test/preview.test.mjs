import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

test('private previews retain their route and snapshot through renderer navigation',async()=>{
 const code=await readFile(new URL('../../admin-cms/preview-bridge.js',import.meta.url),'utf8');
 for(const path of ['/preview/','/test-preview/']){
  const location=new URL('https://cms.example'+path),calls=[];
  const navigate=(state,title,url)=>{if(url!=null)location.href=new URL(url,'https://cms.example/').href;};
  const context={location,URL,Request,history:{replaceState:navigate,pushState:navigate},window:{fetch:async(input,options)=>{calls.push([input,options]);}}};
  vm.runInNewContext(code,context);
  context.history.replaceState(null,'','#work');
  assert.equal(location.pathname,path);assert.equal(location.hash,'#work');
  context.history.pushState(null,'','#case/example');assert.equal(location.pathname,path);
  const options={cache:'no-store'};
  await context.window.fetch('/content.json',options);
  assert.equal(calls[0][0],path==='/test-preview/'?'/api/test-content':'/content.json');
  assert.equal(calls[0][1],options);
  await context.window.fetch('https://other.example/content.json');
  assert.equal(calls[1][0],'https://other.example/content.json');
  context.history.replaceState(null,'','/admin/');assert.equal(location.pathname,'/admin/');
 }
});
