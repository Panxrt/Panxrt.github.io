import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {GithubAuth} from './auth.mjs';
import {GitStore,CmsError} from './store.mjs';
export const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.gif':'image/gif','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.mp4':'video/mp4','.webm':'video/webm'};
async function body(req){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>4*1024*1024)throw new CmsError('Документ JSON превышает 4 МБ (это не лимит загрузки медиа)',413);chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new CmsError('Некорректный JSON');}}
export function createHandler({config,auth=new GithubAuth(config),storeFactory=s=>new GitStore({repo:config.repo,token:s.token}),sourceRoot=root}){
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
 return async(req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('X-Frame-Options','SAMEORIGIN');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; media-src 'self' https: blob:; font-src 'self' https: data:; connect-src 'self' https://*.dropbox.com https://*.dropboxusercontent.com; frame-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'");
  try{
   if(req.headers.host!==new URL(config.origin).host)throw new CmsError('Неверный Host',403);
   const url=new URL(req.url,config.origin),path=decodeURIComponent(url.pathname);
   if(path==='/auth/login'&&req.method==='GET'){const login=auth.login();res.writeHead(302,{Location:login.url,'Set-Cookie':login.cookie});return res.end();}
   if(path==='/auth/callback'&&req.method==='GET'){const cookies=await auth.callback(req,url);res.writeHead(302,{Location:'/admin/','Set-Cookie':cookies});return res.end();}
   const session=auth.session(req);
   if(path==='/api/session'&&req.method==='GET')return json(res,200,session?{authenticated:true,login:session.login,csrf:session.csrf}:{authenticated:false});
   if(!session){if(path.startsWith('/api/'))throw new CmsError('Войдите через GitHub',401);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end('<!doctype html><meta charset="utf-8"><title>PANXRT CMS</title><h1>PANXRT · CMS test</h1><p>Закрытая тестовая админка. Публичный сайт не изменяется.</p><a href="/auth/login">Войти через GitHub</a>');}
   if(!['GET','HEAD'].includes(req.method))auth.protectWrite(req,session);
   if(path==='/api/logout'&&req.method==='POST'){res.setHeader('Set-Cookie',auth.logout(req));return json(res,200,{ok:true});}
   if(path.startsWith('/api/')||path==='/content.json'){
    const store=storeFactory(session);
    if(path==='/api/draft'&&req.method==='GET')return json(res,200,await store.read());
    if(path==='/api/draft'&&req.method==='PUT'){const b=await body(req);return json(res,200,await store.write(b.data,b.expectedSha));}
    if(path==='/api/versions'&&req.method==='GET')return json(res,200,await store.versions());
    if(path==='/api/restore'&&req.method==='POST'){const b=await body(req);return json(res,200,await store.restore(b.version,b.expectedSha));}
    if(path==='/api/test-release'&&req.method==='GET')return json(res,200,await store.read(store.testBranch));
    if(path==='/api/publish-test'&&req.method==='POST'){const b=await body(req);return json(res,200,await store.publish(b.draftSha,b.testSha));}
    if((path==='/content.json'||path==='/api/test-content')&&req.method==='GET'){const branch=path==='/api/test-content'?store.testBranch:store.draftBranch;return json(res,200,(await store.read(branch)).data);}
    throw new CmsError('Маршрут недоступен',404);
   }
   if(!['GET','HEAD'].includes(req.method))throw new CmsError('Метод запрещён',405);
   let relative=path==='/'||path==='/admin'||path==='/admin/'?'admin-cms/index.html':path==='/preview/'||path==='/test-preview/'?'index.html':path.slice(1);
   if(relative==='case-renderer.js')relative='admin-cms/case-renderer.js';
   if(relative.startsWith('admin/'))relative='admin-cms/'+relative.slice(6);
   if(relative.split('/').some(x=>x.startsWith('.'))||relative.startsWith('cms/')||relative==='content.json'||!types[extname(relative)])throw new CmsError('Файл недоступен',404);
   const file=resolve(sourceRoot,relative);if(!file.startsWith(sourceRoot+sep))throw new CmsError('Путь запрещён',403);
   if(relative==='index.html'){const content=Buffer.from((await readFile(file,'utf8')).replace('<head>','<head><base href="/"><script src="/admin-cms/preview-bridge.js"></script>'));res.writeHead(200,{'Content-Type':types['.html'],'Content-Length':content.length});return res.end(req.method==='HEAD'?undefined:content);}
   const info=await stat(file);if(!info.isFile())throw new CmsError('Файл не найден',404);
   let start=0,end=info.size-1,code=200;const headers={'Content-Type':types[extname(relative)],'Content-Length':info.size};
   if(/^video\//.test(headers['Content-Type'])){headers['Accept-Ranges']='bytes';if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m)throw new CmsError('Неверный Range',416);start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),info.size-1):info.size-1;if(start>end||start>=info.size)throw new CmsError('Range вне файла',416);code=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;headers['Content-Length']=end-start+1;}}
   res.writeHead(code,headers);if(req.method==='HEAD'||!info.size)return res.end();const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);

  }catch(e){const status=e.status||(e.code==='ENOENT'?404:500),message=e.status?e.message:e.code==='ENOENT'?'Файл не найден':'Внутренняя ошибка. Изменения не подтверждены.';if(req.url?.startsWith('/auth/')){const safe=String(message).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));res.writeHead(status,{'Content-Type':'text/html; charset=utf-8'});return res.end('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PANXRT · Вход</title><body><main><h1>Не удалось войти в CMS</h1><p>'+safe+'</p><a href="/admin/">Вернуться ко входу</a></main></body></html>');}json(res,status,{error:message});}
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const config={origin:process.env.CMS_ORIGIN||'http://localhost:8787',repo:process.env.CMS_PRIVATE_REPO,clientId:process.env.GITHUB_CLIENT_ID,clientSecret:process.env.GITHUB_CLIENT_SECRET,ownerId:'156057823'};
 const origin=new URL(config.origin);if(!['http:','https:'].includes(origin.protocol)||origin.pathname!=='/'||origin.username||origin.password||origin.search||origin.hash|| (origin.protocol==='http:'&&!['localhost','127.0.0.1'].includes(origin.hostname)))throw Error('CMS_ORIGIN: HTTPS или локальный localhost');
 const host=process.env.CMS_BIND_HOST||'127.0.0.1';
 if(!['127.0.0.1','0.0.0.0'].includes(host))throw Error('CMS_BIND_HOST: 127.0.0.1 или 0.0.0.0');
 if(host==='0.0.0.0'&&origin.protocol!=='https:')throw Error('Внешний CMS требует HTTPS origin и TLS reverse proxy');
 const server=http.createServer(createHandler({config}));server.requestTimeout=30000;server.listen(Number(process.env.PORT)||8787,host,()=>console.log('Private CMS: '+config.origin+'/admin/ · production writes disabled'));
}
