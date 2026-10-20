import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories, doctors, patients, services } from '@/lib/db/schema';

// Verificări "acest rând aparține clinicii mele?" pentru id-uri venite din browser.
// Fișierul NU are 'use server': funcțiile de aici se apelează doar din server actions,
// nu trebuie să poată fi apelate direct din browser.

export async function isCategoryInClinic(categoryId: string, clinicId: string) {
    const [row] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.id, categoryId), eq(categories.clinicId, clinicId)))
        .limit(1);
    return Boolean(row);
}

export async function isPatientInClinic(patientId: string, clinicId: string) {
    const [row] = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, patientId), eq(patients.clinicId, clinicId)))
        .limit(1);
    return Boolean(row);
}

export async function isDoctorInClinic(doctorId: string, clinicId: string) {
    const [row] = await db
        .select({ id: doctors.id })
        .from(doctors)
        .where(and(eq(doctors.id, doctorId), eq(doctors.clinicId, clinicId)))
        .limit(1);
    return Boolean(row);
}

export async function isServiceInClinic(serviceId: string, clinicId: string) {
    const [row] = await db
        .select({ id: services.id })
        .from(services)
        .where(and(eq(services.id, serviceId), eq(services.clinicId, clinicId)))
        .limit(1);
    return Boolean(row);
}
