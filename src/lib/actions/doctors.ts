'use server'

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorsSchema, type DoctorFormData } from "@/lib/validations/doctors";
import { doctors } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isCategoryInClinic } from "@/lib/db/ownership";

export async function getDoctors() {
    const { clinicId } = await getCurrentUser();
    const result = await db.select().from(doctors).where(eq(doctors.clinicId, clinicId)).orderBy(doctors.createdAt)
    return result;
}

export async function createDoctor(data: DoctorFormData) {
    const { clinicId } = await getCurrentUser();
    const result = doctorsSchema.safeParse(data);

    if (!result.success) {
        return {
            success: false,
            error: 'Datele introduse nu sunt valide. Verificați cîmpurile complete.'
        }
    }
    const validated = result.data;
    if (!(await isCategoryInClinic(validated.categoryId, clinicId))) {
        return { success: false, error: 'Specializarea selectată nu există.' };
    }

    await db.insert(doctors).values({
        ...validated,
        hireDate: validated.hireDate === '' ? undefined : validated.hireDate,
        clinicId,
    })
    revalidatePath('/setari/medici')
    return { success: true };
}

export async function updateDoctor(id: string, data: DoctorFormData) {
    const { clinicId } = await getCurrentUser();
    const result = doctorsSchema.safeParse(data)

    if (!result.success) {
        return {
            success: false,
            error: 'Datele introduse nu sunt valide. Verificați cîmpurile completate'
        }
    }

    const validated = result.data;
    if (!(await isCategoryInClinic(validated.categoryId, clinicId))) {
        return { success: false, error: 'Specializarea selectată nu există.' };
    }

    await db
        .update(doctors)
        .set({ ...validated, hireDate: validated.hireDate === '' ? undefined : validated.hireDate, })
        .where(and(eq(doctors.id, id), eq(doctors.clinicId, clinicId)))
    revalidatePath('/setari/medici')
    return { success: true }
}

export async function deleteDoctor(id: string) {
    const { clinicId } = await getCurrentUser();
    try {
        await db.delete(doctors).where(and(eq(doctors.id, id), eq(doctors.clinicId, clinicId)));
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
