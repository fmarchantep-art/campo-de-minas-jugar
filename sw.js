const prefix='campo013-'+self.registration.scope+'-';
const version=prefix+'b39ab577a532665b',shell=["./","manifest.webmanifest","icono-192.png","icono-512.png","icono-180.png","audio/bruma-ronda-5.wav","audio/bruma.wav","audio/lose.wav","audio/umbra-ronda-5.wav","audio/umbra.wav","audio/win.wav"];
const url=name=>new URL(name,self.registration.scope).href;
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(version).then(cache=>cache.addAll(shell.map(name=>new Request(url(name),{cache:'reload'})))));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys())if(key.startsWith(prefix)&&key!==version)await caches.delete(key);
    await self.clients.claim();
  })());
});
// Confirma la copia que realmente servirá este worker, también al arrancar sin red.
self.addEventListener('message',event=>{
  if(event.data?.tipo!=='comprobar-descarga')return;
  event.waitUntil((async()=>{
    let completa=false;
    try{
      const cache=await caches.open(version);
      const guardados=new Set((await cache.keys()).map(req=>req.url));
      const pendientes=shell.map(url).filter(recurso=>!guardados.has(recurso));
      if(pendientes.length)await cache.addAll(pendientes.map(recurso=>new Request(recurso,{cache:'reload'})));
      completa=true;
    }catch{ /* Se puede reintentar cuando vuelva la conexión. */ }
    event.source?.postMessage({tipo:'estado-descarga',completa});
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const target=new URL(req.url);target.search='';target.hash='';
  if([self.registration.scope,url('instalar.html'),url('index.html')].includes(target.href))target.href=url(shell[0]);
  if(!shell.some(name=>url(name)===target.href))return;
  event.respondWith(caches.open(version).then(async cache=>(await cache.match(target.href))||fetch(req)));
});
