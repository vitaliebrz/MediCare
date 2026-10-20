'use client'
import { useSyncExternalStore } from "react";

// Abonare la evenimentele browser-ului: React re-citește valoarea când se schimbă conexiunea
function subscribe(callback: () => void) {
    window.addEventListener('online', callback);
    window.addEventListener('offline', callback);
    return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
    }
}

export function useOnlineStatus() {
    return useSyncExternalStore(
        subscribe,
        () => navigator.onLine, // pe client
        () => true              // pe server (nu există navigator)
    );
}
