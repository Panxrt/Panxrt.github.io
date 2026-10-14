// Reuses the legacy upload panel; chunks stay in the browser and private Dropbox.
(function(){
 const jobs=new Set(),make=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const dismiss=job=>{job.row.remove();document.getElementById('uploads').hidden=!document.getElementById('upload-list').children.length;};
 const post=(url,value)=>CMS.api(url,{method:'POST',body:JSON.stringify(value)});
 async function chunk(job,bytes){const headers=await CMS.uploadHeaders();if(job.paused||job.cancelled)throw Error('Пауза');return new Promise((resolve,reject)=>{
  const x=new XMLHttpRequest();job.xhr=x;x.open('PUT','/api/media/chunk');x.timeout=120000;
  for(const [key,value]of Object.entries({...headers,'Content-Type':'application/octet-stream','X-Upload-Ticket':job.ticket,'X-Upload-Offset':String(job.offset)}))x.setRequestHeader(key,value);
  x.upload.onprogress=e=>{if(e.lengthComputable){job.progress.value=(job.offset+e.loaded)/job.file.size;job.label.textContent=Math.floor(job.progress.value*100)+'%';}};
  x.onload=()=>{job.xhr=null;let result;try{result=JSON.parse(x.responseText);}catch{reject(Error('Нет ответа сервера. Нажмите «Продолжить».'));return;}if(x.status>=200&&x.status<300)resolve(result);else reject(Error(result.error||'Загрузка приостановлена'));};
  x.onerror=x.ontimeout=()=>{job.xhr=null;reject(Error('Связь прервалась. Нажмите «Продолжить».'));};x.onabort=()=>{job.xhr=null;reject(Error('Пауза'));};x.send(bytes);
 });}
 async function run(job){if(job.running)return;job.running=true;job.paused=false;job.pause.textContent='Пауза';job.label.textContent='Подготовка…';try{
  if(!job.ticket){const status=await CMS.api('/api/media/status');if(!status.configured)throw Error('Dropbox ещё не подключён. Пока используйте URL файла.');
   const ext=job.file.name.split('.').pop().toLowerCase(),fallback={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',avif:'image/avif',svg:'image/svg+xml',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime'};
   if(job.paused||job.cancelled)throw Error('Пауза');const transfer=await post('/api/media/start',{size:job.file.size,type:job.file.type||fallback[ext]});Object.assign(job,transfer);
  }
  while(job.offset<job.file.size){if(job.paused||job.cancelled)throw Error('Пауза');const end=Math.min(job.offset+job.chunk,job.file.size),result=await chunk(job,job.file.slice(job.offset,end));if(result.offset!==end)throw Error('Хранилище не подтвердило часть файла');job.offset=result.offset;job.progress.value=job.offset/job.file.size;}
  if(job.paused||job.cancelled)throw Error('Пауза');job.label.textContent='Сохранение файла…';const result=await post('/api/media/finish',{ticket:job.ticket});
  if(job.cancelled)return;const applied=job.complete(result);job.finished=true;jobs.delete(job);job.progress.value=1;job.label.textContent=applied===false?'Файл не применён: карточка изменена':'Загружено · сохраните изменения';job.pause.remove();job.cancel.textContent='Скрыть';setTimeout(()=>dismiss(job),4500);
 }catch(e){if(!job.cancelled){job.paused=true;job.label.textContent=e.message;job.pause.textContent='Продолжить';job.progress.value=(job.offset||0)/job.file.size;}}finally{job.running=false;}}
 window.Uploads={get pending(){return jobs.size>0;},start(file,complete){if(!file.size){alert('Файл пуст.');return false;}if(jobs.size>=3){alert('Сначала завершите или отмените одну из текущих загрузок.');return false;}
  const row=make('div'),name=make('span',file.name),progress=make('progress'),label=make('small'),pause=make('button','Пауза'),cancel=make('button','Отменить');row.className='upload-job';progress.max=1;progress.value=0;row.append(name,progress,label,pause,cancel);document.getElementById('upload-list').append(row);document.getElementById('uploads').hidden=false;
  const job={file,complete,row,progress,label,pause,cancel,offset:0};jobs.add(job);pause.onclick=()=>{if(job.running){job.paused=true;job.xhr?.abort();pause.textContent='Продолжить';}else run(job);};cancel.onclick=()=>{job.cancelled=true;job.xhr?.abort();jobs.delete(job);dismiss(job);};run(job);return true;
 }};
})();
