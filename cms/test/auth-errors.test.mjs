import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createHandler} from '../server.mjs';
test('missing OAuth secret returns readable HTML without exposing configured values',async()=>{
 const config={origin:'http://127.0.0.1',clientId:'public-test-client',clientSecret:'',ownerId:'123'};
 const server=http.createServer((req,res)=>createHandler({config})(req,res));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 config.origin='http://127.0.0.1:'+server.address().port;
 try{const r=await fetch(config.origin+'/auth/login');assert.equal(r.status,503);assert.match(r.headers.get('content-type'),/text\/html/);const html=await r.text();assert.ok(html.includes('GITHUB_CLIENT_SECRET'));assert.ok(!html.includes('public-test-client'));assert.ok(html.includes('Вернуться ко входу'));}
 finally{await new Promise(resolve=>server.close(resolve));}
});
