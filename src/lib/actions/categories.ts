'use server'
import { db } from "@/lib/db";
import { categories, doctors, services } from "@/lib/db/schema";
import { categorySchema, type CategoryFormData } from "@/lib/validations/categories";
import { revalidatePath } from "next/cache";
import { and, count, eq } from 'drizzle-orm';
import { getCurrentUser } from "@/lib/auth/current-user";


export async function getCategories() {
    const { clinicId } = await getCurrentUser();
    const result = await db.select().from(categories).where(eq(categories.clinicId, clinicId));
    return result
}

export async function createCategory(data: CategoryFormData) {
    const { clinicId } = await getCurrentUser();
    const result = categorySchema.safeParse(data);
    if (!result.success) {
        return {
            success: false,
            error: 'Datele nu sunt completate corect'
        }
    }
    const validated = result.data;
    await db.insert(categories).values({
        ...validated,
        clinicId,
    })
    revalidatePath('/setari/categorii')
    return { success: true }
}
async function getCategoryUsageError(id: string, clinicId: string): Promise<string | null> {

    // Cele două numărări nu depind una de alta, deci rulează în paralel
    const [[{ total: totalMedici }], [{ total: totalServicii }]] = await Promise.all([
        db.select({ total: count() })
            .from(doctors)
            .where(and(eq(doctors.categoryId, id), eq(doctors.clinicId, clinicId))),
        db.select({ total: count() })
            .from(services)
            .where(and(eq(services.categoryId, id), eq(services.clinicId, clinicId))),
    ]);
    const parts: string[] = [];



    if (totalMedici > 0) {
        parts.push(totalMedici> 1 ?`${totalMedici} medici`: 'un medic')
    }
    if (totalServicii > 0) {
        parts.push(totalServicii > 1 ? `${totalServicii} servicii` : 'un serviciu')
    }
    if (parts.length === 0) {
        return null;
    }
    return `Categoria nu poate fi ștearsă, este folosită de ${parts.join(' și ')}`;
}
export async function checkCategoryUsage(id: string) {
    const { clinicId } = await getCurrentUser();
    try {
        const usageError = await getCategoryUsageError(id, clinicId);
        if (usageError) {
            return { success: false, error: usageError };
        }
        return { success: true };
    } catch {
        return { success: false, error: 'Ceva nu a mers bine' }
    }
}
export async function deleteCategory(id: string) {
    // în afara lui try: redirect() spre /login funcționează aruncând o eroare specială,
    // pe care catch-ul de mai jos ar înghiți-o
    const { clinicId } = await getCurrentUser();
    try {
        const usageError = await getCategoryUsageError(id, clinicId);
        if (usageError) {
            return { success: false, error: usageError };
        }
        await db.delete(categories).where(and(eq(categories.id, id), eq(categories.clinicId, clinicId)))
        revalidatePath('/setari/categorii')
        return {
            success: true

        }
    } catch {
        return {
            success: false,
            error: `Ceva nu a mers la ștergerea categoriei`
        }
    }
}
