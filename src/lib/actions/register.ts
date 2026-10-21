'use server';

import { db } from '@/lib/db';
import { clinics, clinicSettings, users } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';

// Înregistrare = o clinică nouă + primul ei utilizator (admin)
export async function registerClinic(data: RegisterFormData) {
    const result = registerSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: 'Datele introduse nu sunt valide. Verificați câmpurile completate.' };
    }
    const { clinicName, fullName, email, password } = result.data;

    // 1. Contul în Supabase Auth. Cu "Confirm email" dezactivat, utilizatorul e logat imediat
    //    (clientul de server scrie cookie-urile de sesiune).
    const supabase = await createClient();
    const { data: signUpData, error } = await supabase.auth.signUp({ email: email.trim(), password });

    if (error || !signUpData.user) {
        const messages: Record<string, string> = {
            user_already_exists: 'Există deja un cont cu acest email.',
            email_address_invalid: 'Adresa de email nu este validă.',
            weak_password: 'Parola este prea slabă. Alege una mai lungă.',
        };
        return { success: false, error: messages[error?.code ?? ''] ?? 'Nu am putut crea contul. Încearcă din nou.' };
    }
    const authUser = signUpData.user;

    // 2. Clinica, setările ei și utilizatorul, într-o tranzacție: ori se creează toate, ori niciuna
    try {
        await db.transaction(async (tx) => {
            const [clinic] = await tx.insert(clinics).values({}).returning({ id: clinics.id });
            await tx.insert(clinicSettings).values({ clinicId: clinic.id, clinicName });
            await tx.insert(users).values({
                id: authUser.id,
                clinicId: clinic.id,
                email: authUser.email ?? email,
                fullName,
                role: 'admin',
            });
        });
    } catch (err) {
        console.error('Register error: ', err);
        await supabase.auth.signOut();
        return { success: false, error: 'Contul a fost creat, dar clinica nu. Contactează administratorul.' };
    }

    // Fără sesiune = în Supabase e încă activ "Confirm email"; utilizatorul trebuie să confirme întâi
    return { success: true, needsConfirmation: !signUpData.session };
}
