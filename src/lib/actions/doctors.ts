'use server'

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorsSchema, type DoctorFormData } from "@/lib/validations/doctors";
import { doctors } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function getDoctors() {
    const result = await db.select().from(doctors).orderBy(doctors.createdAt)
    return result;
}

export async function createDoctor(data: DoctorFormData) {
    const result = doctorsSchema.safeParse(data);
    
    if (!result.success) {
        return {
            success: false,
            error: 'Datele introduse nu sunt valide. Verificați cîmpurile complete.'
        }
    }
    const validated = result.data;

    await db.insert(doctors).values({
        ...validated,
        hireDate: validated.hireDate === '' ? undefined : validated.hireDate,
    })
    revalidatePath('/setari/medici')
    return { success: true };
}

export async function updateDoctor(id: string, data: DoctorFormData) {
    const result = doctorsSchema.safeParse(data)

    if (!result.success) {
        return {
            success: false,
            error: 'Datele introduse nu sunt valide. Verificați cîmpurile completate'
        }
    }

    const validated = result.data;

    await db
        .update(doctors)
        .set({ ...validated, hireDate: validated.hireDate === '' ? undefined : validated.hireDate, })
        .where(eq(doctors.id, id))
    revalidatePath('/setari/medici')
    return { success: true }
}

export async function deleteDoctor(id: string) {
    try {
        await db.delete(doctors).where(eq(doctors.id, id));
        revalidatePath('/setari/medici')
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