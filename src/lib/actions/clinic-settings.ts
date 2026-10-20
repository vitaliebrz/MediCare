'use server';

import { db } from '@/lib/db';
import { clinicSettings } from '@/lib/db/schema';
import { clinicSettingsSchema, type ClinicSettingsFormData } from '@/lib/validations/clinic-settings';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/current-user';

export async function getClinicSettings() {
    const { clinicId } = await getCurrentUser();
    const result = await db.select().from(clinicSettings).where(eq(clinicSettings.clinicId, clinicId)).limit(1);
    return result[0] ?? null;
}

export async function updateClinicSettings(data: ClinicSettingsFormData) {
    const { clinicId } = await getCurrentUser();

    //Validsare sigura - NU arunca eroare, returneaza un obiect cu rezultatul
    const result = clinicSettingsSchema.safeParse(data);

    if (!result.success) {
        return {
            success: false,
            error: 'Datele introduse nu sunt valide. Verificați cîmpurile completate.'
        };

    }
    const validated = result.data;

    // Fiecare clinică are un singur rând de setări (clinic_id e unic), găsit după clinicId din sesiune.
    // Upsert: dacă rândul lipsește (clinică creată fără înregistrare), îl creăm; altfel îl actualizăm.
    // Doar UPDATE ar modifica 0 rânduri și ar raporta totuși „Salvat”.
    await db
        .insert(clinicSettings)
        .values({ ...validated, clinicId })
        .onConflictDoUpdate({
            target: clinicSettings.clinicId,
            set: { ...validated, updatedAt: new Date() },
        });

    revalidatePath('/setari/clinica');
    revalidatePath('/programari'); // calendarul folosește intervalul orar din setări
    // Returanm succes, ca UI-ul sa stie ce sa intamplat
    return { success: true };
}
