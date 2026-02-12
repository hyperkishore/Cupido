/**
 * Cupido Service Worker
 * Handles offline functionality, caching, and push notifications
 */

const CACHE_NAME = 'cupido-v1.0.0';
const OFFLINE_PAGE = '/offline.html';

// Files to cache for offline functionality
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  OFFLINE_PAGE,
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle navigation requests (page loads)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If network fails, serve offline page
          return caches.match(OFFLINE_PAGE);
        })
    );
    return;
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Clone the request for network fetch
      const fetchRequest = request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone response for caching
        const responseToCache = response.clone();

        // Cache the response
        caches.open(CACHE_NAME).then((cache) => {
          // Only cache GET requests
          if (request.method === 'GET') {
            cache.put(request, responseToCache);
          }
        });

        return response;
      }).catch(() => {
        // If both cache and network fail, return offline fallback for images
        if (request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666">Image unavailable offline</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
        
        // For other resources, just let it fail gracefully
        throw new Error('Network request failed and no cache available');
      });
    })
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');

  let notificationData = {
    title: 'Cupido',
    body: 'You have a new notification',
    icon: '/favicon-192x192.png',
    badge: '/favicon-96x96.png',
    tag: 'cupido-notification',
    data: {},
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      console.log('[SW] Push data was not JSON');
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/favicon-32x32.png'
        },
        {
          action: 'close',
          title: 'Dismiss',
        }
      ]
    })
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked', event.notification.tag);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      
      // Open new window if app not open
      return clients.openWindow('/');
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'cupido-sync') {
    event.waitUntil(
      // Sync offline data when connection is restored
      syncOfflineData()
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Helper function to sync offline data
async function syncOfflineData() {
  try {
    // Get offline data from IndexedDB or localStorage
    // Send to server when connection is restored
    console.log('[SW] Syncing offline data...');
    
    // This would implement actual sync logic in production
    // For now, just log that sync would occur
    
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error;
  }
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service Worker script loaded');