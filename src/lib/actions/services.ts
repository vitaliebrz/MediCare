'use server';

import { db } from '@/lib/db';
import { services } from "@/lib/db/schema";
import { servicesSchema, type ServicesFormData } from '@/lib/validations/services';
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isCategoryInClinic } from '@/lib/db/ownership';

export async function getServices() {
    const { clinicId } = await getCurrentUser();
    const result = await db.select().from(services).where(eq(services.clinicId, clinicId)).orderBy(services.createdAt);
    return result;
}

export async function createService(data: ServicesFormData) {
    const { clinicId } = await getCurrentUser();
    const result = servicesSchema.safeParse(data);

    if (!result.success) {
        return {
            success: false,
            error: 'Datele introduse nu sunt valide. Verificați cîmpurile complete.'
        };
    }
    const validated = result.data;
    if (!(await isCategoryInClinic(validated.categoryId, clinicId))) {
        return { success: false, error: 'Categoria selectată nu există.' };
    }

    await db.insert(services).values({
        ...validated,
        price: validated.price.toString(),
        clinicId,
    });

    revalidatePath('/setari/servicii')
    return { success: true };

}

export async function deleteService(id: string) {
    const { clinicId } = await getCurrentUser();
    try {
        await db.delete(services).where(and(eq(services.id, id), eq(services.clinicId, clinicId)));
        revalidatePath('/setari/servicii')
        return {
            success: true
        }
    } catch {
        return {
            success: false,
            error: 'Ceva nu a mers la ștergere'
        }
    }

}

export async function updateService(id: string, data: ServicesFormData) {
    const { clinicId } = await getCurrentUser();
    const result = servicesSchema.safeParse(data);

    if (!result.success) {
        return {
            success: false,
            error: 'Datele introduse nu sunt valide. Verificați câmpurile complete.'
        };
    }
    const validated = result.data;
    if (!(await isCategoryInClinic(validated.categoryId, clinicId))) {
        return { success: false, error: 'Categoria selectată nu există.' };
    }

    await db
        .update(services)
        .set({
            ...validated,
            price: validated.price.toString()
        })
        .where(and(eq(services.id, id), eq(services.clinicId, clinicId)));

    revalidatePath('/setari/servicii');
    return { success: true }
}
