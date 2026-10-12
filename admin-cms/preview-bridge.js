// The same public renderer fetches a PRIVATE draft/test snapshot on this host.
const previewPath=location.pathname;
const isTestPreview=previewPath==='/test-preview/';
// The renderer uses fragment-only history updates. Its root <base> must not
// move a private preview to / (the editor) or change which snapshot it reads.
for(const method of ['replaceState','pushState']){
 const nativeHistory=history[method].bind(history);
 history[method]=(state,title,url)=>nativeHistory(state,title,
  typeof url==='string'&&url.startsWith('#')?previewPath+location.search+url:url);
}
const nativeFetch=window.fetch.bind(window);
window.fetch=(input,options)=>{
 const url=new URL(input instanceof Request?input.url:input,location.href);
 if(url.origin===location.origin&&url.pathname==='/content.json'&&isTestPreview)return nativeFetch('/api/test-content',options);
 return nativeFetch(input,options);
};
