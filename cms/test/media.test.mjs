import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {DropboxMedia,CHUNK,MAX_FILE} from '../media.mjs';
import {createHandler} from '../server.mjs';
import {CmsError} from '../store.mjs';
function fixture(){let offset=0,committed=null,clock=0,refreshes=0;const calls=[];
 const media=new DropboxMedia({clientId:'test-client',clientSecret:'test-secret',refreshToken:'test-refresh',ticketSecret:'test-only-ticket-secret-not-for-deployment',now:()=>clock,fetcher:async(url,o)=>{
 calls.push({url,o});const ok=(v,status=200)=>new Response(JSON.stringify(v),{status});
 if(url.endsWith('/oauth2/token')){refreshes++;return ok({access_token:'test-access',expires_in:3600});}
 const a=o.headers['Dropbox-API-Arg']?JSON.parse(o.headers['Dropbox-API-Arg']):JSON.parse(o.body);
 if(url.endsWith('/start'))return ok({session_id:'private-provider-session'});
 if(url.endsWith('/append_v2')){if(a.cursor.offset!==offset)return ok({error:{'.tag':'incorrect_offset',correct_offset:offset}},409);offset+=o.body.length;return ok(null);}
 if(url.endsWith('/finish')){if(committed)return ok({error:{'.tag':'lookup_failed'}},409);if(a.cursor.offset!==offset)return ok({error:{'.tag':'lookup_failed'}},409);committed={size:offset,path_lower:a.commit.path};return ok(committed);}
 if(url.endsWith('/get_metadata'))return committed?ok(committed):ok({error:{}},409);
 throw Error('Unexpected provider request');
 }});
 return{media,calls,get refreshes(){return refreshes;},advance(n){clock+=n;}};
}
test('large upload preserves bytes, retries confirmed chunks, commits privately and retries finish',async()=>{
 const f=fixture(),size=7*CHUNK+3,t=await f.media.start({size,type:'video/mp4'},'owner');
 assert.ok(size>25*1024*1024);assert.ok(!t.ticket.includes('private-provider-session'));
 for(let offset=0;offset<size;){const bytes=Buffer.alloc(Math.min(CHUNK,size-offset),37),r=await f.media.append(t.ticket,offset,bytes,'owner');assert.equal(r.offset,offset+bytes.length);assert.deepEqual(await f.media.append(t.ticket,offset,bytes,'owner'),r);offset=r.offset;}
 const result=await f.media.finish(t.ticket,'owner');assert.equal(result.size,size);assert.equal(result.mediaType,'video');assert.match(result.src,/^\/api\/media\/file\/[a-f0-9-]+\.mp4$/);assert.deepEqual(await f.media.finish(t.ticket,'owner'),result);
 assert.equal(f.refreshes,1);assert.ok(f.calls.every(c=>!c.url.includes('sharing')));
 const call=f.calls.find(c=>c.url.endsWith('/append_v2'));assert.equal(call.o.body[0],37);assert.equal(call.o.body.length,CHUNK);
 const finish=JSON.parse(f.calls.find(c=>c.url.endsWith('/finish')).o.headers['Dropbox-API-Arg']);assert.equal(finish.commit.mode,'add');assert.equal(finish.commit.autorename,false);
});
test('tickets reject foreign owner, tampering, expiry and oversized chunks before provider calls',async()=>{
 const f=fixture(),t=await f.media.start({size:CHUNK*2,type:'image/png'},'owner'),before=f.calls.length;
 await assert.rejects(f.media.append(t.ticket,0,Buffer.from('x'),'other'),e=>e.status===403);
 await assert.rejects(f.media.append('broken',0,Buffer.from('x'),'owner'),e=>e.status===403);
 await assert.rejects(f.media.append(t.ticket,0,Buffer.alloc(CHUNK+1),'owner'));
 await assert.rejects(f.media.append(t.ticket,-1,Buffer.from('x'),'owner'));
 f.advance(49*3600000);await assert.rejects(f.media.append(t.ticket,0,Buffer.from('x'),'owner'),e=>e.status===403);assert.equal(f.calls.length,before);
});
test('unconfigured storage, unsupported types and provider maximum fail closed',async()=>{
 const f=fixture();await assert.rejects(new DropboxMedia().start({size:1,type:'image/png'},'owner'),e=>e.status===503);
 await assert.rejects(f.media.start({size:1,type:'text/html'},'owner'));await assert.rejects(f.media.start({size:MAX_FILE+1,type:'video/mp4'},'owner'));assert.equal(f.calls.length,0);
});
test('session token renewal and restart retain resumable tickets',async()=>{
 const f=fixture(),t=await f.media.start({size:2,type:'image/png'},'owner');await f.media.append(t.ticket,0,Buffer.from('a'),'owner');f.advance(3600000);await f.media.append(t.ticket,1,Buffer.from('b'),'owner');assert.equal(f.refreshes,2);
 const restarted=new DropboxMedia({clientId:f.media.clientId,clientSecret:f.media.clientSecret,refreshToken:f.media.refreshToken,ticketSecret:f.media.ticketSecret,fetcher:f.media.fetcher,now:f.media.now});assert.equal((await restarted.finish(t.ticket,'owner')).size,2);
});
test('media routes require existing owner session and CSRF; private download is sandboxed',async()=>{
 const config={origin:'http://127.0.0.1'},auth={session:req=>req.headers.cookie==='test=owner'?{login:'owner',csrf:'test-csrf'}:null,protectWrite(req){if(req.headers['x-csrf-token']!=='test-csrf')throw new CmsError('CSRF',403);}};
 let writes=0;const media={configured:true,async start(){writes++;return{ticket:'test'};},async download(){return{type:'image/svg+xml',response:new Response('<svg/>',{headers:{'content-length':'6'}})};}};
 const server=http.createServer(createHandler({config,auth,media}));await new Promise(r=>server.listen(0,'127.0.0.1',r));config.origin='http://127.0.0.1:'+server.address().port;
 try{assert.equal((await fetch(config.origin+'/api/media/file/test.svg')).status,401);
 assert.equal((await fetch(config.origin+'/api/media/start',{method:'POST',headers:{Cookie:'test=owner'},body:'{}'})).status,403);assert.equal(writes,0);
 assert.equal((await fetch(config.origin+'/api/media/start',{method:'POST',headers:{Cookie:'test=owner','X-CSRF-Token':'test-csrf'},body:'{}'})).status,200);assert.equal(writes,1);
 const r=await fetch(config.origin+'/api/media/file/test.svg',{headers:{Cookie:'test=owner'}});assert.match(r.headers.get('content-security-policy'),/sandbox/);assert.equal(await r.text(),'<svg/>');
 }finally{await new Promise(r=>server.close(r));}
});
