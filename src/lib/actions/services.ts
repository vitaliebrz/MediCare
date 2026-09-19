'use server';

import { db } from '@/lib/db';
import { services } from "@/lib/db/schema";
import { servicesSchema, type ServicesFormData } from '@/lib/validations/services';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export async function getServices() {
    const result = await db.select().from(services).orderBy(services.createdAt);
    return result;
}

export async function createService(data: ServicesFormData) {
    const result = servicesSchema.safeParse(data);

    if (!result.success) {
        return {
            success: false,
            error: 'Datele introduse nu sunt valide. Verificați cîmpurile complete.'
        };
    }
    const validated = result.data;

    await db.insert(services).values({
        ...validated,
        price: validated.price.toString()
    });

    revalidatePath('/setari/servicii')
    return { success: true };

}

export async function deleteService(id: string) {
    try {
        await db.delete(services).where(eq(services.id, id));
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
    const result = servicesSchema.safeParse(data);

    if (!result.success) {
        return {
            success: false,
            error: 'Datele introduse nu sunt valide. Verificați câmpurile complete.'
        };
    }
    const validated = result.data;

    await db
        .update(services)
        .set({
            ...validated,
            price: validated.price.toString()
        })
        .where(eq(services.id, id));

    revalidatePath('/setari/servicii');
    return { success: true }
}