import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
    rememberMe: boolean;
    lastLoginEmail: string | null;
    lastLoginAt: string | null;
    setRememberMe: (value: boolean) => void;
    setLastLogin: (email: string) => void;
    clearLastLogin: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            rememberMe: false,
            lastLoginEmail: null,
            lastLoginAt: null,

            setRememberMe: (value) => set({ rememberMe: value }),
            
            setLastLogin: (email) => set({
                lastLoginEmail: email,
                lastLoginAt: new Date().toISOString(),
            }),
            clearLastLogin: () => set({
                lastLoginEmail: null,
                lastLoginAt: null,
            }),
        }),
        {
            name: 'medicare-auth-preferences',
            storage: createJSONStorage(() => localStorage),
        }
    )
);