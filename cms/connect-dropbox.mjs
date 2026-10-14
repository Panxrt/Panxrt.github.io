// One-time owner-run helper. No credentials are printed or sent to the CMS/browser.
import http from 'node:http';
import {createHash,randomBytes} from 'node:crypto';
import {access,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const CALLBACK='http://localhost:8788/dropbox/callback';
export const SCOPES='files.content.write files.content.read files.metadata.read';
const random=()=>randomBytes(32).toString('base64url');
export function createConnection({clientId,clientSecret,save,fetcher=fetch,now=Date.now}){
 if(!clientId||!clientSecret)throw Error('Задайте DROPBOX_CLIENT_ID и DROPBOX_CLIENT_SECRET в локальном env-файле.');
 const state=random(),verifier=random(),expires=now()+10*60000;let used=false;
 const url=new URL('https://www.dropbox.com/oauth2/authorize');url.search=new URLSearchParams({client_id:clientId,response_type:'code',token_access_type:'offline',redirect_uri:CALLBACK,state,scope:SCOPES,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'});
 async function callback(incoming){
  if(used||now()>expires||incoming.searchParams.get('state')!==state)throw Error('Неверный или истёкший запрос. Запустите подключение заново.');
  used=true;if(incoming.searchParams.has('error')||!incoming.searchParams.get('code'))throw Error('Доступ не подтверждён.');
  const r=await fetcher('https://api.dropboxapi.com/oauth2/token',{method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',client_id:clientId,client_secret:clientSecret,redirect_uri:CALLBACK,code:incoming.searchParams.get('code'),code_verifier:verifier}),signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error('Dropbox не подтвердил вход. Запустите подключение заново.');
  const b=await r.json();if(!b.refresh_token)throw Error('Dropbox не выдал постоянный ключ доступа.');
  const scopes=new Set(String(b.scope||'').split(' '));if(SCOPES.split(' ').some(s=>!scopes.has(s))||[...scopes].some(s=>s&&!SCOPES.split(' ').includes(s)))throw Error('Выданные разрешения отличаются от необходимых. Проверьте App-folder приложение.');
  await save({DROPBOX_CLIENT_ID:clientId,DROPBOX_CLIENT_SECRET:clientSecret,DROPBOX_REFRESH_TOKEN:b.refresh_token,CMS_UPLOAD_TICKET_SECRET:random()});
 }
 return{url:url.href,callback};
}
export async function saveEnvironment(path,values){
 for(const value of Object.values(values))if(typeof value!=='string'||!value||/[\r\n\0"\\]/.test(value))throw Error('Некорректный формат конфигурации.');
 await writeFile(path,Object.entries(values).map(([k,v])=>`${k}="${v}"`).join('\n')+'\n',{flag:'wx',mode:0o600});
}
export async function main(){
 const output=resolve('.env.dropbox-cms');try{await access(output);throw Error('Файл .env.dropbox-cms уже существует. Существующее подключение не перезаписано.');}catch(e){if(e.code!=='ENOENT')throw e;}
 const connection=createConnection({clientId:process.env.DROPBOX_CLIENT_ID,clientSecret:process.env.DROPBOX_CLIENT_SECRET,save:values=>saveEnvironment(output,values)});
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");res.setHeader('Content-Type','text/plain; charset=utf-8');
  if(req.headers.host!=='localhost:8788'||req.method!=='GET'){res.writeHead(403);return res.end('Запрос отклонён.');}
  const incoming=new URL(req.url,CALLBACK);if(incoming.pathname!=='/dropbox/callback'){res.writeHead(404);return res.end('Не найдено.');}
  try{await connection.callback(incoming);res.end('Подключение подготовлено. Закройте вкладку и вернитесь в терминал.');console.log('Готово: .env.dropbox-cms. Перенесите его четыре значения только в Render Environment тестовой CMS. Не отправляйте файл в чат или Git.');}
  catch{res.writeHead(400);res.end('Подключение не завершено. Перезапустите локальный помощник.');console.error('Подключение не завершено. Проверьте App-folder, scopes и Redirect URI. Секреты не выведены.');}
  finally{clearTimeout(timeout);server.close();}
 });
 server.requestTimeout=30000;const timeout=setTimeout(()=>{server.close();console.error('Время подключения истекло.');},10*60000);
 try{await new Promise((ok,fail)=>{server.once('error',fail);server.listen(8788,'127.0.0.1',ok);});}catch{clearTimeout(timeout);throw Error('Порт 8788 занят. Закройте другой помощник подключения.');}
 console.log('Откройте ссылку в браузере на ЭТОМ ЖЕ компьютере. Подтвердите доступ только к папке PANXRT CMS:\n'+connection.url);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
