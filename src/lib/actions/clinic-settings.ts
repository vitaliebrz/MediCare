'use server';

import { db } from '@/lib/db';
import { clinicSettings } from '@/lib/db/schema';
import { clinicSettingsSchema, type ClinicSettingsFormData } from '@/lib/validations/clinic-settings';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/current-user';
import { storage } from '@/lib/supabase/admin';
import { detectLogoFormat, LOGO_BUCKET, LOGO_TYPES, MAX_LOGO_BYTES } from '@/lib/clinic-logo';

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

// ====================================================
// Logo-ul clinicii (Supabase Storage, bucket public; vezi src/lib/clinic-logo.ts)
// ====================================================

// Bucket-ul se creează la prima încărcare, ca să nu fie nevoie de configurare manuală în Supabase
async function ensureLogoBucket() {
    if (await storage.bucketExists(LOGO_BUCKET)) return;
    await storage.createBucket(LOGO_BUCKET, {
        public: true, // logo-ul apare în PDF-uri; nu e o dată sensibilă
        fileSizeLimit: MAX_LOGO_BYTES,
        allowedMimeTypes: Object.values(LOGO_TYPES),
    });
}

// Șterge logo-urile vechi ale clinicii (folderul ei), păstrând opțional unul
async function removeOldLogos(clinicId: string, keep?: string) {
    const files = await storage.list(LOGO_BUCKET, clinicId);
    await storage.remove(LOGO_BUCKET, files.filter((path) => path !== keep));
}

async function saveLogoUrl(clinicId: string, logoUrl: string | null) {
    const updated = await db.update(clinicSettings)
        .set({ logoUrl, updatedAt: new Date() })
        .where(eq(clinicSettings.clinicId, clinicId))
        .returning({ id: clinicSettings.id });
    revalidatePath('/setari/clinica');
    revalidatePath('/rapoarte');
    return updated.length > 0;
}

export async function uploadClinicLogo(formData: FormData) {
    const { clinicId } = await getCurrentUser();
    const file = formData.get('logo');
    if (!(file instanceof File) || file.size === 0) return { success: false, error: 'Alege o imagine.' };
    if (file.size > MAX_LOGO_BYTES) return { success: false, error: 'Imaginea e prea mare (maxim 1 MB).' };

    const bytes = new Uint8Array(await file.arrayBuffer());
    const format = detectLogoFormat(bytes);
    if (!format) return { success: false, error: 'Logo-ul trebuie să fie PNG sau JPG.' };

    try {
        await ensureLogoBucket();
        // Nume nou la fiecare încărcare: browserul și PDF-urile nu rămân cu imaginea veche în cache
        const path = `${clinicId}/logo-${Date.now()}.${format}`;
        await storage.upload(LOGO_BUCKET, path, bytes, LOGO_TYPES[format]);
        if (!(await saveLogoUrl(clinicId, storage.publicUrl(LOGO_BUCKET, path)))) {
            await storage.remove(LOGO_BUCKET, [path]);
            return { success: false, error: 'Salvează mai întâi informațiile clinicii.' };
        }
        await removeOldLogos(clinicId, path);
        return { success: true };
    } catch {
        return { success: false, error: 'Logo-ul nu a putut fi încărcat. Încearcă din nou.' };
    }
}

export async function removeClinicLogo() {
    const { clinicId } = await getCurrentUser();
    try {
        await saveLogoUrl(clinicId, null);
        await removeOldLogos(clinicId);
    } catch {
        return { success: false, error: 'Logo-ul nu a putut fi șters.' };
    }
    return { success: true };
}
