// The same public renderer fetches a PRIVATE draft/test snapshot on this host.
const nativeFetch=window.fetch.bind(window);
window.fetch=(input,options)=>{
 const url=new URL(input instanceof Request?input.url:input,location.href);
 if(url.origin===location.origin&&url.pathname==='/content.json'&&location.pathname==='/test-preview/')return nativeFetch('/api/test-content',options);
 return nativeFetch(input,options);
};
