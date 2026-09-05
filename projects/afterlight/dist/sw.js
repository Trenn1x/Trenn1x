/* Afterlight caches only its own static assets. Plan inputs stay in localStorage. */
'use strict';
const CACHE = 'afterlight-static-v3';
const ASSETS = ['./', 'index.html', 'styles.css', 'model.js', 'app.js', 'icon.svg', 'manifest.webmanifest', 'afterlight-offline.html'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('afterlight-static-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET')return;
  const url=new URL(event.request.url);
  if(url.origin !== self.location.origin)return;
  const assetNames=ASSETS.map(path=>new URL(path,self.registration.scope).pathname);
  if(!assetNames.includes(url.pathname))return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok && response.type==='basic' && !response.redirected){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request).then(cached=>cached || (event.request.mode==='navigate' ? caches.match(new URL('./',self.registration.scope).href) : Response.error()))));
});
