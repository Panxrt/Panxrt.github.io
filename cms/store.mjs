// Only content.json in a configured PRIVATE repository can be written.
export class CmsError extends Error { constructor(message,status=400){super(message);this.status=status;} }
export function validateContent(data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw new CmsError('Некорректный документ');
 for(const key of ['works','brands','categories']){
  if(!Array.isArray(data[key]))throw new CmsError('Отсутствует '+key);
  const ids=new Set();for(const item of data[key]){if(!item||typeof item.id!=='string'||!item.id||ids.has(item.id))throw new CmsError('Некорректный/повторяющийся ID: '+key);ids.add(item.id);}
 }
 const visit=(value,key='',depth=0)=>{if(depth>40)throw new CmsError('Слишком вложенный документ');if(typeof value==='number'&&!Number.isFinite(value))throw new CmsError('Некорректное число');
  if(typeof value==='string'&&['src','poster','href','url'].includes(key)&&value){
   if(/[\x00-\x20\\]/.test(value)||!(/^(https?:\/\/|\/(?!\/)|\.\/|[\w-]+\.)/i.test(value))||/^(javascript|data|blob|file):/i.test(value))throw new CmsError('Разрешены только безопасные ссылки на медиа');
  }
  if(value&&typeof value==='object')for(const [k,v]of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(k))throw new CmsError('Недопустимый ключ');visit(v,k,depth+1);}
 };visit(data);return data;
}
export class GitStore {
 constructor({repo,draftBranch='main',testBranch='cms-test-published',token,fetcher=fetch}){
  if(!/^[-\w.]+\/[-\w.]+$/.test(repo||'')||repo.toLowerCase()==='panxrt/panxrt.github.io')throw new CmsError('Нужен отдельный приватный репозиторий',503);
  if(!/^[\w/-]+$/.test(draftBranch)||testBranch!=='cms-test-published'||draftBranch===testBranch)throw new CmsError('Небезопасная конфигурация веток',503);
  Object.assign(this,{repo,draftBranch,testBranch,token,fetcher});
 }
 async request(path,{method='GET',body}={}){
  const r=await this.fetcher('https://api.github.com/repos/'+this.repo+path,{method,headers:{Authorization:'Bearer '+this.token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw new CmsError(r.status===409||r.status===422?'Конфликт версии. Перезагрузите удалённый черновик, сохранив свою копию.':r.status===401?'Сеанс GitHub истёк. Войдите снова.':'GitHub недоступен или недостаточно прав ('+r.status+')',r.status===409||r.status===422?409:r.status===401?401:502);
  return r.status===204?null:r.json();
 }
 async guard(){const r=await this.request('');if(r.private!==true)throw new CmsError('Хранилище черновиков должно быть PRIVATE',403);}
 async head(branch){return(await this.request('/git/ref/heads/'+branch)).object.sha;}
 async readAt(sha){if(!/^[0-9a-f]{40}$/.test(sha))throw new CmsError('Некорректная версия');const r=await this.request('/contents/content.json?ref='+sha);return validateContent(JSON.parse(Buffer.from(r.content,'base64').toString('utf8')));}
 async read(branch=this.draftBranch){await this.guard();const sha=await this.head(branch);return {sha,data:await this.readAt(sha)};}
 async write(data,expectedSha,branch=this.draftBranch,message='CMS: save private draft'){
  if(![this.draftBranch,this.testBranch].includes(branch))throw new CmsError('Ветка запрещена',403);
  validateContent(data);await this.guard();const head=await this.head(branch);if(head!==expectedSha)throw new CmsError('Конфликт: черновик изменён с другого устройства. Скачайте свою копию и откройте удалённую версию.',409);
  const previous=await this.readAt(head);data=structuredClone(data);data.revision=Math.max(Number(previous.revision)||0,Number(data.revision)||0)+1;
  const commit=await this.request('/git/commits/'+head);
  const tree=await this.request('/git/trees',{method:'POST',body:{base_tree:commit.tree.sha,tree:[{path:'content.json',mode:'100644',type:'blob',content:JSON.stringify(data,null,2)+'\n'}]}});
  const next=await this.request('/git/commits',{method:'POST',body:{message,tree:tree.sha,parents:[head]}});
  await this.request('/git/refs/heads/'+branch,{method:'PATCH',body:{sha:next.sha,force:false}});
  return{sha:next.sha,data};
 }
 async versions(){await this.guard();const rows=await this.request('/commits?sha='+this.draftBranch+'&path=content.json&per_page=30');return rows.map(x=>({sha:x.sha,date:x.commit.author.date,message:x.commit.message}));}
 async restore(version,expectedSha){const versions=await this.versions();if(!versions.some(x=>x.sha===version))throw new CmsError('Версия не найдена');return this.write(await this.readAt(version),expectedSha,this.draftBranch,'CMS: restore content '+version.slice(0,8));}
 async publish(draftSha,testSha){const draft=await this.read();if(draft.sha!==draftSha)throw new CmsError('Черновик изменился. Сохраните и проверьте предпросмотр.',409);const result=await this.write(draft.data,testSha,this.testBranch,'CMS: publish TEST '+draftSha.slice(0,8));return {sha:result.sha,status:'test-committed',deployment:false};}
}
