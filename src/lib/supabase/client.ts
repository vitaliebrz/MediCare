import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';


const REMEMBER_ME_KEY = 'medicare-remember-me';

const createDynamicStorage = () => {
    if (typeof window === 'undefined') return undefined;

    return {
        getItem: (key: string) => {
            const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
            const storage = rememberMe ? localStorage : sessionStorage;
            return storage.getItem(key);
        },
        setItem: (key: string, value: string) => {
            const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem(key, value);
        },
        removeItem: (key: string) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        },
        
    };
};

let supabaseClient: SupabaseClient | null = null;

export function createClient() {
    if (supabaseClient) return supabaseClient;

    supabaseClient =  createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                storage: createDynamicStorage(),
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
        }
    );
    return supabaseClient;
}

export function setRememberMePreference(remember: boolean) {
    if (typeof window === 'undefined') return;
    if (remember) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
    } else {
        localStorage.setItem(REMEMBER_ME_KEY, 'false')
    }
}

export function getRememeberMePreference(): boolean{
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
}
