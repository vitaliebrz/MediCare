'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth/current-user';
import { createClient } from '@/lib/supabase/server';
import { authAdmin } from '@/lib/supabase/admin';
import {
    changeEmailSchema,
    changePasswordSchema,
    profileSchema,
    type ChangeEmailFormData,
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

// Verifică parola curentă logând din nou utilizatorul. Cine găsește calculatorul deschis
// nu poate schimba emailul sau parola fără s-o știe.
// Întoarce și clientul: sesiunea tocmai verificată e în el (folosită apoi la schimbarea parolei).
async function verifyCurrentPassword(email: string, password: string) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return { supabase, error: null };
    return {
        supabase,
        error: error.code === 'invalid_credentials'
            ? 'Parola curentă nu este corectă.'
            : 'Nu am putut verifica parola. Încearcă din nou peste un minut.',
    };
}

export async function changeEmail(data: ChangeEmailFormData) {
    const { id, email: currentEmail } = await getCurrentUser();
    const result = changeEmailSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.issues[0]?.message ?? 'Datele introduse nu sunt valide.' };
    }
    const { email, currentPassword } = result.data;
    if (email === currentEmail.toLowerCase()) {
        return { success: false, field: 'email' as const, error: 'Acesta este deja emailul tău.' };
    }

    const { error: passwordError } = await verifyCurrentPassword(currentEmail, currentPassword);
    if (passwordError) return { success: false, field: 'currentPassword' as const, error: passwordError };

    // Emailul e în două locuri: Supabase Auth (login) și tabelul users (afișare, clinică).
    // Tranzacție: dacă Supabase refuză, modificarea din users se anulează și ele rămân la fel.
    try {
        await db.transaction(async (tx) => {
            await tx.update(users).set({ email, updatedAt: new Date() }).where(eq(users.id, id));
            const errorCode = await authAdmin.updateEmail(id, email);
            if (errorCode) throw new Error(errorCode);
        });
    } catch (error) {
        // Adresa e deja folosită dacă:
        // - Supabase Auth răspunde 'email_exists' sau '23505' (codul Postgres pentru valoare duplicată, testat);
        // - tabelul users dă 23505 (Drizzle învelește eroarea Postgres în `cause`, ca în patient.ts)
        const authCode = error instanceof Error ? error.message : '';
        const pgCode = (error as { cause?: { code?: string } })?.cause?.code;
        const taken = authCode === 'email_exists' || authCode === '23505' || pgCode === '23505';
        if (!taken) console.error('Change email error: ', error);
        return {
            success: false,
            field: 'email' as const,
            error: taken ? 'Există deja un cont cu acest email.' : 'Nu am putut schimba emailul. Încearcă din nou.',
        };
    }

    revalidatePath('/', 'layout'); // emailul apare și în meniul de pe telefon
    return { success: true };
}

export async function changePassword(data: ChangePasswordFormData) {
    const { email } = await getCurrentUser();
    const result = changePasswordSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.issues[0]?.message ?? 'Datele introduse nu sunt valide.' };
    }
    const { currentPassword, password } = result.data;

    // 1. Parola curentă
    const { supabase, error: passwordError } = await verifyCurrentPassword(email, currentPassword);
    if (passwordError) return { success: false, field: 'currentPassword' as const, error: passwordError };

    // 2. Parola nouă, pe același client (are sesiunea tocmai verificată)
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
