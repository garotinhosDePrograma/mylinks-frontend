// Nome do cache (você pode mudar a versão quando atualizar o site)
const CACHE_NAME = "mylinks-cache-v1";

// Lista de arquivos que serão armazenados no cache
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

// Instala o service worker e adiciona arquivos ao cache
self.addEventListener("install", (event) => {
  console.log("Service Worker: Instalando...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Cache criado!");
      return cache.addAll(urlsToCache);
    })
  );
});

// Ativa o service worker e limpa caches antigos
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Ativado!");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Intercepta requisições e responde com cache (quando offline)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retorna do cache se disponível, senão busca na rede
      return response || fetch(event.request);
    })
  );
});
