// Nome do cache (você pode mudar a versão quando atualizar o site)
const CACHE_NAME = "mylinks-cache-v1.11";

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
  const requestUrl = new URL(event.request.url);

  // ⚠️ Ignora requisições da API ou rotas privadas
  if (requestUrl.pathname.startsWith("/auth/") || requestUrl.pathname.startsWith("/api/")) {
    // Não intercepta — deixa seguir direto pra rede
    return;
  }

  // ⚙️ Responde com cache se disponível, senão busca na rede
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log("Service Worker: Recurso do cache →", requestUrl.pathname);
        return response;
      }
      console.log("Service Worker: Recurso da rede →", requestUrl.pathname);
      return fetch(event.request);
    })
  );
});
