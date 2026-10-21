'use client';

import { useEffect } from 'react';

// Înregistrează service worker-ul (public/sw.js) o singură dată, după încărcarea paginii.
// Doar în producție: în `next dev` un service worker poate servi fișiere vechi și încurcă lucrul.
export const ServiceWorkerRegister = () => {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
        navigator.serviceWorker
            .register('/sw.js', { scope: '/', updateViaCache: 'none' })
            .catch((error) => console.error('Service worker error: ', error));
    }, []);
    return null;
};
