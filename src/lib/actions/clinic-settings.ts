'use server';

import { db } from '@/lib/db';
import { clinicSettings } from '@/lib/db/schema';
import { clinicSettingsSchema, type ClinicSettingsFormData } from '@/lib/validations/clinic-settings';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export async function getClinicSettings() {
    const result = await db.select().from(clinicSettings).limit(1);
    return result[0] ?? null;
}

export async function updateClinicSettings(id: string | undefined, data: ClinicSettingsFormData) {
    //Validsare sigura - NU arunca eroare, returneaza un obiect cu rezultatul
    const result = clinicSettingsSchema.safeParse(data);

    if (!result.success) {
        return {
            success: false,
            error: 'Datele introduse nu sunt valide. Verificați cîmpurile completate.'
        };
        
    }
    const validated = result.data;

    if (id) {
        await db
            .update(clinicSettings) //vreau sa MODIFC tableul clinic_settings
            .set({ ...validated, updatedAt: new Date() }) // cu aceste valori noi
            .where(eq(clinicSettings.id, id)); // DAR doar randul unde id = valoarea primita
    } else {
        await db.insert(clinicSettings).values(validated); // vreau sa adaug un rand nou in tabelul ... cu aceste valori
    }

    revalidatePath('/setari/clinica');
    // Returanm succes, ca UI-ul sa stie ce sa intamplat
    return { success: true };
}