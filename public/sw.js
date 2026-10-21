// Service worker-ul MediCare: un script care rulează în fundal, separat de pagină.
// Rolul lui e unul singur: când nu e internet și deschizi o pagină, arată /offline.html
// în locul erorii browserului.
//
// Intenționat NU păstrează pe dispozitiv pagini sau date ale aplicației: fișele pacienților
// sunt date medicale, iar un telefon pierdut nu trebuie să le conțină. În cache stau doar
// pagina offline și iconița ei.

const CACHE = 'medicare-offline-v1'; // schimbă versiunea când se modifică fișierele de mai jos
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png'];

// La instalare: salvăm pagina offline
self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
    self.skipWaiting(); // versiunea nouă intră în lucru imediat
});

// La activare: ștergem cache-urile versiunilor vechi
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    // Pagina offline și iconița ei, din cache (sunt cerute chiar când nu e internet)
    const url = new URL(request.url);
    if (url.origin === self.location.origin && PRECACHE.includes(url.pathname)) {
        event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
        return;
    }
    // Doar navigările (deschiderea unei pagini): întâi rețeaua; dacă nu răspunde, pagina offline.
    // Restul cererilor (date, imagini, acțiuni) merg direct la server, ca fără service worker.
    if (request.mode === 'navigate') {
        event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    }
});
