import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {GitStore,validateContent} from '../store.mjs';
import {GithubAuth} from '../auth.mjs';
import {createHandler} from '../server.mjs';
const initial={revision:119,works:[{id:'work-1',title:'Original',src:'/image.png'}],brands:[],categories:[]};
const sha=n=>n.toString(16).padStart(40,'0');
function fixture(){
 let serial=2,isPrivate=true;const commits=new Map([[sha(1),{data:structuredClone(initial),parents:[],message:'Initial'}]]),trees=new Map(),heads={main:sha(1),'cms-test-published':sha(1)},calls=[];
 const fetcher=async(url,options={})=>{const u=new URL(url),p=u.pathname.replace('/repos/owner/private',''),b=options.body&&JSON.parse(options.body),method=options.method||'GET';calls.push({p,method,b});let value,status=200;
  if(p==='')value={private:isPrivate};
  else if(p.startsWith('/git/ref/heads/'))value={object:{sha:heads[p.slice(15)]}};
  else if(p==='/contents/content.json'){const c=commits.get(u.searchParams.get('ref'));value={content:Buffer.from(JSON.stringify(c.data)).toString('base64')};}
  else if(p.startsWith('/git/commits/'))value={tree:{sha:p.slice(13)}};
  else if(p==='/git/trees'){assert.equal(b.tree.length,1);assert.equal(b.tree[0].path,'content.json');const id=sha(serial++);trees.set(id,JSON.parse(b.tree[0].content));value={sha:id};}
  else if(p==='/git/commits'){const id=sha(serial++);commits.set(id,{data:trees.get(b.tree),parents:b.parents,message:b.message});value={sha:id};}
  else if(p.startsWith('/git/refs/heads/')){const branch=p.slice(16);assert.equal(b.force,false);if(commits.get(b.sha).parents[0]!==heads[branch]){status=422;value={message:'not fast forward'};}else{heads[branch]=b.sha;value={object:{sha:b.sha}};}}
  else if(p==='/commits'){let id=heads[u.searchParams.get('sha')];value=[];while(id){const c=commits.get(id);value.push({sha:id,commit:{message:c.message,author:{date:'2026-10-10T00:00:00Z'}}});id=c.parents[0];}}
  else throw Error('Unexpected API '+method+' '+p);
  return new Response(JSON.stringify(value),{status});
 };
 return{store:new GitStore({repo:'owner/private',token:'test',fetcher}),heads,calls,setPrivate:v=>isPrivate=v};
}
test('draft save, conflict, history, restore and TEST publication keep production untouched',async()=>{
 const f=fixture(),start=await f.store.read();assert.equal(start.data.works[0].title,'Original');
 const changed=structuredClone(initial);changed.works[0].title='Edited';const saved=await f.store.write(changed,start.sha);
 await assert.rejects(f.store.write(initial,start.sha),e=>e.status===409);
 assert.equal((await f.store.versions()).length,2);await f.store.publish(saved.sha,sha(1));assert.equal((await f.store.read('cms-test-published')).data.works[0].title,'Edited');
 const restored=await f.store.restore(start.sha,saved.sha);assert.equal(restored.data.works[0].title,'Original');assert.notEqual(restored.sha,start.sha);
 assert.ok(f.calls.filter(x=>x.method==='PATCH').every(x=>['/git/refs/heads/main','/git/refs/heads/cms-test-published'].includes(x.p)));
});
test('public draft stores, production repository and foreign branches fail closed',async()=>{
 assert.throws(()=>new GitStore({repo:'Panxrt/Panxrt.github.io',token:'x'}));const f=fixture();f.setPrivate(false);await assert.rejects(f.store.read(),e=>e.status===403);await assert.rejects(f.store.write(initial,sha(1)),e=>e.status===403);assert.equal(f.calls.filter(x=>x.method!=='GET').length,0);
 f.setPrivate(true);await assert.rejects(f.store.write(initial,sha(1),'other'),e=>e.status===403);
});
test('content validation keeps original data, rejects dangerous media and duplicate IDs',async()=>{
 const content=JSON.parse(await readFile(new URL('../../content.json',import.meta.url)));assert.equal(validateContent(content),content);
 for(const src of ['javascript:alert(1)','data:text/html,x','//evil.example/x','https://example.com/\nfile'])assert.throws(()=>validateContent({...initial,works:[{id:'x',src}]}));
 assert.throws(()=>validateContent({...initial,works:[{id:'x'},{id:'x'}]}));
});
test('OAuth PKCE, state/cookie binding, owner allowlist and session rotation',async()=>{
 const config={origin:'https://cms.example',clientId:'client',clientSecret:'secret',ownerId:'156057823'};let exchange=null,userId=156057823;
 const auth=new GithubAuth(config,async(url,opt)=>{if(url.includes('access_token')){exchange=JSON.parse(opt.body);return Response.json({access_token:'server-only',expires_in:3600});}return Response.json({id:userId,login:'Panxrt'});});
 const login=auth.login(),url=new URL(login.url);assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.ok(login.cookie.includes('HttpOnly'));const callback=new URL('https://cms.example/auth/callback?code=x&state='+url.searchParams.get('state'));
 await assert.rejects(auth.callback({headers:{cookie:'panxrt_oauth=wrong'}},callback),e=>e.status===403);
 const retry=auth.login(),state=new URL(retry.url).searchParams.get('state');const cookies=await auth.callback({headers:{cookie:retry.cookie.split(';')[0]}},new URL('https://cms.example/auth/callback?code=x&state='+state));
 assert.equal(exchange.client_secret,'secret');assert.equal(exchange.code_verifier.length,43);const session=auth.session({headers:{cookie:cookies[0].split(';')[0]}});assert.equal(session.token,'server-only');assert.ok(!cookies.join('').includes('server-only'));
 assert.throws(()=>auth.protectWrite({headers:{origin:'https://evil.example','x-csrf-token':session.csrf}},session));
 userId=2;const denied=auth.login();await assert.rejects(auth.callback({headers:{cookie:denied.cookie.split(';')[0]}},new URL('https://cms.example/auth/callback?code=x&state='+new URL(denied.url).searchParams.get('state'))),e=>e.status===403);
});
test('HTTP authenticated save→preview→test publish→restore; no unauthenticated data or CSRF write',async t=>{
 const config={origin:'http://localhost:0'},auth=new GithubAuth(config),f=fixture();auth.sessions.set('test-session',{token:'mock',csrf:'csrf-test',expires:Date.now()+60000,login:'Panxrt'});
 const server=http.createServer(createHandler({config,auth,storeFactory:()=>f.store}));await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>server.close());config.origin='http://127.0.0.1:'+server.address().port;
 const request=(path,options={})=>fetch(config.origin+path,options);const headers={cookie:'panxrt_session=test-session',origin:config.origin,'X-CSRF-Token':'csrf-test','Content-Type':'application/json'};
 assert.equal((await request('/api/draft')).status,401);assert.equal((await request('/api/draft',{method:'PUT',headers:{cookie:headers.cookie},body:'{}'})).status,403);
 const original=await(await request('/api/draft',{headers})).json();const changed=structuredClone(initial);changed.works[0].title='HTTP edited';
 const saved=await(await request('/api/draft',{method:'PUT',headers,body:JSON.stringify({data:changed,expectedSha:original.sha})})).json();assert.ok(saved.sha);
 assert.equal((await(await request('/content.json',{headers})).json()).works[0].title,'HTTP edited');
 const published=await(await request('/api/publish-test',{method:'POST',headers,body:JSON.stringify({draftSha:saved.sha,testSha:sha(1)})})).json();assert.equal(published.deployment,false);
 assert.equal((await(await request('/api/test-content',{headers})).json()).works[0].title,'HTTP edited');
 const restored=await(await request('/api/restore',{method:'POST',headers,body:JSON.stringify({version:original.sha,expectedSha:saved.sha})})).json();assert.equal(restored.data.works[0].title,'Original');
 const preview=await request('/preview/',{headers});assert.match(await preview.text(),/preview-bridge.js/);assert.equal(preview.headers.get('cache-control'),'no-store');
 for(const path of ['/cms/server.mjs','/.git/config','/api/content'])assert.equal((await request(path,{headers})).status,404);
 const session=await(await request('/api/session',{headers})).json();assert.ok(!('token'in session));
 await request('/api/logout',{headers,method:'POST'});assert.equal((await request('/api/draft',{headers})).status,401);
});

test('simultaneous saves cannot overwrite each other',async()=>{
 const f=fixture();const outcomes=await Promise.allSettled([f.store.write(initial,sha(1)),f.store.write({...initial,revision:120},sha(1))]);assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);assert.equal(outcomes.find(x=>x.status==='rejected').reason.status,409);
});
