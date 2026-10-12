import {randomBytes,createHash} from 'node:crypto';
import {CmsError} from './store.mjs';
const random=()=>randomBytes(32).toString('base64url');
export class GithubAuth {
 constructor(config,fetcher=fetch){this.config=config;this.fetcher=fetcher;this.pending=new Map();this.sessions=new Map();}
 cookie(req,name){return(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);}
 cookieValue(name,value,age,sameSite='Strict'){return `${name}=${value}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${age}${this.config.origin.startsWith('https:')?'; Secure':''}`;}
 session(req){const id=this.cookie(req,'panxrt_session'),session=this.sessions.get(id);if(!session||session.expires<=Date.now()){this.sessions.delete(id);return null;}return session;}
 sweep(){for(const map of [this.pending,this.sessions])for(const [id,v]of map)if(v.expires<Date.now())map.delete(id);}
 login(){this.sweep();const missing=[['GITHUB_CLIENT_ID',this.config.clientId],['GITHUB_CLIENT_SECRET',this.config.clientSecret],['ownerId',this.config.ownerId]].filter(([,value])=>!value||!String(value).trim()).map(([name])=>name);if(missing.length)throw new CmsError('Вход недоступен: на сервере не задан '+missing.join(', ')+'. Добавьте значение в Render Environment и выполните Deploy latest commit.',503);if(this.pending.size>=100)throw new CmsError('Попробуйте войти позже',429);
  const state=random(),verifier=random(),binding=random();this.pending.set(state,{verifier,binding,expires:Date.now()+600000});const url=new URL('https://github.com/login/oauth/authorize');url.search=new URLSearchParams({client_id:this.config.clientId,redirect_uri:this.config.origin+'/auth/callback',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'});return{url:url.href,cookie:this.cookieValue('panxrt_oauth',binding,600,'Lax')};
 }
 async callback(req,url){const state=url.searchParams.get('state'),p=this.pending.get(state);this.pending.delete(state);if(!p||p.expires<Date.now()||p.binding!==this.cookie(req,'panxrt_oauth')||!url.searchParams.get('code'))throw new CmsError('Неверный или истёкший OAuth state',403);
  const r=await this.fetcher('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:this.config.clientId,client_secret:this.config.clientSecret,code:url.searchParams.get('code'),redirect_uri:this.config.origin+'/auth/callback',code_verifier:p.verifier}),signal:AbortSignal.timeout(20000)});const token=await r.json();if(!r.ok||!token.access_token)throw new CmsError('Не удалось завершить вход',401);
  const u=await this.fetcher('https://api.github.com/user',{headers:{Authorization:'Bearer '+token.access_token,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(20000)});const user=await u.json();if(!u.ok||String(user.id)!==String(this.config.ownerId))throw new CmsError('Вход разрешён только владельцу',403);
  const old=this.cookie(req,'panxrt_session');if(old)this.sessions.delete(old);const id=random();const age=Math.min(3600,Number(token.expires_in)||3600);this.sessions.set(id,{token:token.access_token,csrf:random(),login:user.login,expires:Date.now()+age*1000});return[this.cookieValue('panxrt_session',id,age),this.cookieValue('panxrt_oauth','',0,'Lax')];
 }
 protectWrite(req,session){if(req.headers.origin!==this.config.origin||req.headers['x-csrf-token']!==session.csrf)throw new CmsError('Запрос отклонён (CSRF)',403);}
 logout(req){this.sessions.delete(this.cookie(req,'panxrt_session'));return this.cookieValue('panxrt_session','',0);}
}
