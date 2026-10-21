'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth/current-user';
import { createClient } from '@/lib/supabase/server';
import {
    changePasswordSchema,
    profileSchema,
    type ChangePasswordFormData,
    type ProfileFormData,
} from '@/lib/validations/account';

// Toate acțiunile lucrează DOAR pe utilizatorul din sesiune: id-ul nu vine niciodată din browser.

export async function updateProfile(data: ProfileFormData) {
    const { id } = await getCurrentUser();
    const result = profileSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: 'Datele introduse nu sunt valide. Verificați câmpurile completate.' };
    }

    await db.update(users)
        .set({ fullName: result.data.fullName, phone: result.data.phone || null, updatedAt: new Date() })
        .where(eq(users.id, id));

    // 'layout': numele apare și în meniul din stânga (în layout), pe orice pagină
    revalidatePath('/', 'layout');
    return { success: true };
}

export async function changePassword(data: ChangePasswordFormData) {
    const { email } = await getCurrentUser();
    const result = changePasswordSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.issues[0]?.message ?? 'Datele introduse nu sunt valide.' };
    }
    const { currentPassword, password } = result.data;
    const supabase = await createClient();

    // 1. Parola curentă: o verificăm logând din nou utilizatorul. Cine găsește calculatorul
    //    deschis nu poate schimba parola fără s-o știe pe cea veche.
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (signInError) {
        return {
            success: false,
            field: 'currentPassword' as const,
            error: signInError.code === 'invalid_credentials'
                ? 'Parola curentă nu este corectă.'
                : 'Nu am putut verifica parola. Încearcă din nou peste un minut.',
        };
    }

    // 2. Parola nouă
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
        const messages: Record<string, string> = {
            same_password: 'Parola nouă trebuie să fie diferită de cea curentă.',
            weak_password: 'Parola este prea slabă. Alege una mai lungă.',
        };
        return { success: false, field: 'password' as const, error: messages[error.code ?? ''] ?? 'Nu am putut schimba parola. Încearcă din nou.' };
    }
    return { success: true };
}

// Închide sesiunile de pe toate dispozitivele (inclusiv acesta) și trimite la /login.
// Celelalte dispozitive nu mai pot reînnoi sesiunea; tokenul pe care îl au deja (verificat local,
// vezi src/proxy.ts) mai e valid cel mult până expiră, implicit 1 oră.
export async function signOutEverywhere() {
    await getCurrentUser();
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) {
        return { success: false, error: 'Nu am putut închide sesiunile. Încearcă din nou.' };
    }
    redirect('/login');
}
