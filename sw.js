// Service Worker para o AgroDecision PWA

const CACHE_NAME = 'agrodecision-pwa-v1';
const OFFLINE_URL = '/offline.html';

// Arquivos para cache inicial
const INITIAL_CACHED_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/css/styles.css',
  '/css/sidebar.css',
  '/css/map.css',
  '/css/animations.css',
  '/css/noticias-regionais.css',
  '/js/app.js',
  '/js/map.js',
  '/js/simulation.js',
  '/js/consulta-mensal.js',
  '/js/indicadores.js',
  '/js/noticias-regionais.js',
  '/js/animations.js',
  '/js/history.js',
  '/js/auth.js',
  '/js/tests.js',
  '/img/default-user.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instalar o Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  // Pré-cache de recursos essenciais
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pré-cacheando recursos');
        return cache.addAll(INITIAL_CACHED_RESOURCES);
      })
      .then(() => {
        console.log('[Service Worker] Instalação concluída');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Erro durante a instalação:', error);
      })
  );
});

// Ativar o Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  
  // Limpar caches antigos
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.filter((cacheName) => {
            return cacheName !== CACHE_NAME;
          }).map((cacheName) => {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Ativação concluída');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Ignorar requisições para APIs externas que não devem ser cacheadas
  if (event.request.url.includes('api.nasa.gov') || 
      event.request.url.includes('power.larc.nasa.gov') ||
      event.request.url.includes('gnews.io') ||
      event.request.url.includes('nominatim.openstreetmap.org')) {
    return;
  }
  
  // Estratégia: Cache First, fallback para rede, depois offline
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Retornar do cache se disponível
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Caso contrário, buscar da rede
        return fetch(event.request)
          .then((networkResponse) => {
            // Verificar se a resposta é válida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clonar a resposta para armazenar no cache
            const responseToCache = networkResponse.clone();
            
            // Armazenar no cache para uso futuro
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Erro ao buscar recurso:', error);
            
            // Verificar se é uma requisição de página
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // Para outros recursos, retornar um erro
            return new Response('Recurso não disponível offline', {
              status: 503,
              statusText: 'Serviço Indisponível'
            });
          });
      })
  );
});

// Sincronização em segundo plano
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sincronização em segundo plano:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Função para sincronizar dados
async function syncData() {
  try {
    // Obter dados pendentes do IndexedDB
    const pendingData = await getPendingData();
    
    if (pendingData && pendingData.length > 0) {
      console.log('[Service Worker] Sincronizando dados pendentes:', pendingData.length);
      
      // Processar cada item pendente
      for (const item of pendingData) {
        await processPendingItem(item);
      }
      
      // Limpar dados sincronizados
      await clearSyncedData();
      
      // Notificar usuário
      self.registration.showNotification('AgroDecision', {
        body: 'Dados sincronizados com sucesso!',
        icon: '/icons/icon-192x192.png'
      });
    }
  } catch (error) {
    console.error('[Service Worker] Erro durante sincronização:', error);
  }
}

// Função para obter dados pendentes (simulada)
async function getPendingData() {
  // Em uma implementação real, isso buscaria dados do IndexedDB
  return [];
}

// Função para processar item pendente (simulada)
async function processPendingItem(item) {
  // Em uma implementação real, isso enviaria dados para o servidor
  console.log('[Service Worker] Processando item pendente:', item);
  return true;
}

// Função para limpar dados sincronizados (simulada)
async function clearSyncedData() {
  // Em uma implementação real, isso removeria dados do IndexedDB
  return true;
}

// Notificações push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Notificação push recebida:', event);
  
  let notificationData = {
    title: 'AgroDecision',
    body: 'Novidades disponíveis!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: {
      url: '/'
    }
  };
  
  // Tentar extrair dados da notificação
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('[Service Worker] Erro ao processar dados da notificação:', error);
    }
  }
  
  // Mostrar notificação
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data
    })
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Clique em notificação:', event);
  
  // Fechar a notificação
  event.notification.close();
  
  // Obter URL de destino
  const targetUrl = event.notification.data && event.notification.data.url ? 
    event.notification.data.url : '/';
  
  // Abrir ou focar na janela existente
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Verificar se já existe uma janela aberta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        
        // Se não existir, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Mensagem recebida:', event.data);
  
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Script carregado');
