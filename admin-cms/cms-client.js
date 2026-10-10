'use strict';
window.CMS=(()=>{
 let session=null,head=null;
 async function api(path,options={}){if(!session&&path!=='/api/session'){session=await api('/api/session');if(!session.authenticated)throw Error('Войдите через GitHub в новой вкладке /admin/');}
  const r=await fetch(path,{...options,headers:{'Content-Type':'application/json',...(session?.csrf?{'X-CSRF-Token':session.csrf}:{}),...options.headers}});let result;try{result=await r.json();}catch{throw Error('Сервер вернул некорректный ответ. Правки остаются в редакторе.');}if(!r.ok){if(r.status===401)session=null;throw Error(result.error||'Ошибка '+r.status);}return result;}
 const post=(path,value)=>api(path,{method:'POST',body:JSON.stringify(value)});
 return{api,async load(){const r=await api('/api/draft');head=r.sha;return r.data;},async save(data){const r=await api('/api/draft',{method:'PUT',body:JSON.stringify({data,expectedSha:head})});head=r.sha;return r;},async publish(){const test=await api('/api/test-release');return post('/api/publish-test',{draftSha:head,testSha:test.sha});},versions:()=>api('/api/versions'),async restore(version){const r=await post('/api/restore',{version,expectedSha:head});head=r.sha;return r.data;},logout:()=>post('/api/logout',{})};
})();
// Honest placeholder until a separately authorized storage adapter is connected.
window.Uploads={pending:false,start(){window.alert('Прямая загрузка ещё не подключена. Пока используйте URL файла. Файл не отправлен и не изменён.');}};
