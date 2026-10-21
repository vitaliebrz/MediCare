'use server';

import { and, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { doctors, patients, services, teethStatus, treatments, type ToothStatusValue } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isDoctorInClinic, isPatientInClinic, isServiceInClinic } from '@/lib/db/ownership';
import { treatmentSchema, type TreatmentFormData } from '@/lib/validations/treatment';
import { isValidTooth, TOOTH_STATUS_VALUES } from '@/lib/teeth';
import { CLINIC_TIME_ZONE } from '@/lib/dashboard-period';

const INVALID_DATA = 'Datele introduse nu sunt valide. Verificați câmpurile completate.';
const TZ = sql.raw(`'${CLINIC_TIME_ZONE}'`);

// Tot ce are nevoie fișa pacientului, într-un singur apel. null = pacientul nu există sau e al altei clinici.
export async function getPatientChart(patientId: string) {
    const { clinicId } = await getCurrentUser();
    // Un id care nu e uuid ar da eroare în Postgres; îl tratăm ca "nu există"
    if (!z.uuid().safeParse(patientId).success) return null;

    // Toate trei pornesc împreună (nu una după alta): fiecare filtrează pe clinică,
    // deci pentru un pacient al altei clinici dinții și tratamentele vin goale, iar funcția întoarce null
    const [[patient], teeth, history] = await Promise.all([
        db.select()
            .from(patients)
            .where(and(eq(patients.id, patientId), eq(patients.clinicId, clinicId)))
            .limit(1),
        db.select({ toothNumber: teethStatus.toothNumber, status: teethStatus.status })
            .from(teethStatus)
            .where(and(eq(teethStatus.patientId, patientId), eq(teethStatus.clinicId, clinicId))),
        // leftJoin: tratamentul apare și dacă medicul/serviciul lipsește sau a fost șters
        db.select({
            ...getTableColumns(treatments),
            doctorName: doctors.lastName,
            doctorFirstName: doctors.firstName,
            serviceName: services.name,
        })
            .from(treatments)
            .leftJoin(doctors, eq(treatments.doctorId, doctors.id))
            .leftJoin(services, eq(treatments.serviceId, services.id))
            .where(and(eq(treatments.patientId, patientId), eq(treatments.clinicId, clinicId)))
            .orderBy(desc(treatments.performedAt), desc(treatments.createdAt)),
    ]);
    if (!patient) return null;

    return { patient, teeth, treatments: history };
}

export type PatientChart = NonNullable<Awaited<ReturnType<typeof getPatientChart>>>;
export type TreatmentRow = PatientChart['treatments'][number];

// Medicul și serviciul vin din browser ca id-uri; verificăm că sunt ale clinicii
async function checkReferences(data: TreatmentFormData, clinicId: string): Promise<string | null> {
    if (data.doctorId && !(await isDoctorInClinic(data.doctorId, clinicId))) return 'Medicul selectat nu există.';
    if (data.serviceId && !(await isServiceInClinic(data.serviceId, clinicId))) return 'Serviciul selectat nu există.';
    return null;
}

// Data plății pentru un tratament marcat „achitat”:
// tratament de azi -> acum; tratament înregistrat retroactiv -> ziua tratamentului (la prânz, ora Chișinăului),
// ca încasarea să apară în dashboard în ziua în care s-a făcut, nu în ziua în care a fost introdusă.
function paidAtFor(performedAt: string): Date {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Chisinau' });
    return performedAt === today ? new Date() : new Date(`${performedAt}T12:00:00+02:00`);
}

function toDbValues(data: TreatmentFormData) {
    return {
        toothNumber: data.toothNumber,
        doctorId: data.doctorId || null,
        serviceId: data.serviceId || null,
        diagnosis: data.diagnosis,
        treatmentDescription: data.treatmentDescription,
        recomendations: data.recomendations || null,
        price: data.price.toString(),
        paid: data.paid,
        performedAt: data.performedAt,
    };
}

// Tranzacția deschisă cu db.transaction (ca funcțiile de mai jos să ruleze în ea)
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Programarea pacientului din ziua tratamentului devine „Finalizat” (vizita a avut loc).
// Doar una: cea încă programată/confirmată, de preferat cu același medic, apoi cea mai apropiată de ora curentă.
// Anulat / neprezentat nu se ating. Întoarce ora programării finalizate sau null dacă nu era niciuna.
async function finishAppointmentFor(tx: Tx, clinicId: string, patientId: string, performedAt: string, doctorId: string | null) {
    const rows = await tx.execute(sql`
        update appointments set status = 'finalizat'
        where id = (
            select a.id from appointments a
            where a.clinic_id = ${clinicId}
                and a.patient_id = ${patientId}
                and a.status in ('programat', 'confirmat')
                and (a.starts_at at time zone ${TZ})::date = ${performedAt}::date
            order by coalesce(a.doctor_id = ${doctorId}::uuid, false) desc,
                abs(extract(epoch from a.starts_at - now()))
            limit 1
        )
        returning to_char(starts_at at time zone ${TZ}, 'HH24:MI') as time`);
    return rows[0] ? String(rows[0].time) : null;
}

// Upsert: dacă dintele are deja un rând de stare îl actualizăm, altfel îl creăm.
// Primește `tx` ca să poată rula în aceeași tranzacție cu tratamentul.
async function upsertToothStatus(tx: Tx | typeof db, clinicId: string, patientId: string, toothNumber: number, status: ToothStatusValue) {
    await tx.insert(teethStatus)
        .values({ clinicId, patientId, toothNumber, status })
        .onConflictDoUpdate({
            target: [teethStatus.patientId, teethStatus.toothNumber],
            set: { status, updatedAt: new Date() },
        });
}

export async function createTreatment(patientId: string, data: TreatmentFormData) {
    const { id: userId, clinicId } = await getCurrentUser();
    const result = treatmentSchema.safeParse(data);
    if (!result.success) return { success: false, error: INVALID_DATA };
    const validated = result.data;

    if (!(await isPatientInClinic(patientId, clinicId))) return { success: false, error: 'Pacientul nu există.' };
    const referenceError = await checkReferences(validated, clinicId);
    if (referenceError) return { success: false, error: referenceError };

    let finishedAppointmentTime: string | null = null;
    try {
        // Tratamentul, noua stare a dintelui și finalizarea programării se salvează împreună: ori toate, ori niciuna
        finishedAppointmentTime = await db.transaction(async (tx) => {
            await tx.insert(treatments).values({
                ...toDbValues(validated),
                paidAt: validated.paid ? paidAtFor(validated.performedAt) : null,
                clinicId,
                patientId,
                performedBy: userId,
            });
            if (validated.toothNumber !== null && validated.newToothStatus) {
                await upsertToothStatus(tx, clinicId, patientId, validated.toothNumber, validated.newToothStatus);
            }
            return finishAppointmentFor(tx, clinicId, patientId, validated.performedAt, validated.doctorId || null);
        });
    } catch {
        return { success: false, error: 'Tratamentul nu a putut fi salvat. Încearcă din nou.' };
    }

    revalidatePath(`/pacienti/${patientId}`);
    if (finishedAppointmentTime) {
        revalidatePath('/programari');
        revalidatePath('/'); // „Programări azi” din dashboard
    }
    return { success: true, finishedAppointmentTime };
}

export async function updateTreatment(id: string, data: TreatmentFormData) {
    const { clinicId } = await getCurrentUser();
    const result = treatmentSchema.safeParse(data);
    if (!result.success) return { success: false, error: INVALID_DATA };
    const validated = result.data;

    const referenceError = await checkReferences(validated, clinicId);
    if (referenceError) return { success: false, error: referenceError };

    try {
        const patientId = await db.transaction(async (tx) => {
            const [updated] = await tx.update(treatments)
                .set({
                    ...toDbValues(validated),
                    // Dacă era deja achitat, păstrăm data plății; dacă devine achitat acum, o setăm; altfel null.
                    // Data e trimisă ca text ISO: driverul postgres nu acceptă obiecte Date în sql`` scris manual.
                    paidAt: validated.paid ? sql`coalesce(${treatments.paidAt}, ${paidAtFor(validated.performedAt).toISOString()}::timestamptz)` : null,
                })
                .where(and(eq(treatments.id, id), eq(treatments.clinicId, clinicId)))
                .returning({ patientId: treatments.patientId });
            if (!updated) return null;
            if (validated.toothNumber !== null && validated.newToothStatus) {
                await upsertToothStatus(tx, clinicId, updated.patientId, validated.toothNumber, validated.newToothStatus);
            }
            return updated.patientId;
        });
        if (!patientId) return { success: false, error: 'Tratamentul nu există.' };
        revalidatePath(`/pacienti/${patientId}`);
    } catch {
        return { success: false, error: 'Modificările nu au putut fi salvate. Încearcă din nou.' };
    }
    return { success: true };
}

// Starea dintelui NU se schimbă înapoi la ștergere: nu știm ce stare avea înainte.
// Medicul o poate corecta manual din panoul dintelui.
export async function deleteTreatment(id: string) {
    const { clinicId } = await getCurrentUser();
    try {
        const [deleted] = await db.delete(treatments)
            .where(and(eq(treatments.id, id), eq(treatments.clinicId, clinicId)))
            .returning({ patientId: treatments.patientId });
        if (deleted) revalidatePath(`/pacienti/${deleted.patientId}`);
    } catch {
        return { success: false, error: 'Tratamentul nu a putut fi șters.' };
    }
    return { success: true };
}

export async function setTreatmentPaid(id: string, paid: boolean) {
    const { clinicId } = await getCurrentUser();
    try {
        const [updated] = await db.update(treatments)
            .set({ paid, paidAt: paid ? sql`coalesce(${treatments.paidAt}, now())` : null })
            .where(and(eq(treatments.id, id), eq(treatments.clinicId, clinicId)))
            .returning({ patientId: treatments.patientId });
        if (updated) revalidatePath(`/pacienti/${updated.patientId}`);
    } catch {
        return { success: false, error: 'Statusul plății nu a putut fi schimbat.' };
    }
    return { success: true };
}

// Schimbare manuală a stării (ex. "extras" fără un tratament înregistrat)
export async function setToothStatus(patientId: string, toothNumber: number, status: ToothStatusValue) {
    const { clinicId } = await getCurrentUser();
    if (!isValidTooth(toothNumber) || !TOOTH_STATUS_VALUES.includes(status)) {
        return { success: false, error: INVALID_DATA };
    }
    if (!(await isPatientInClinic(patientId, clinicId))) return { success: false, error: 'Pacientul nu există.' };

    try {
        await upsertToothStatus(db, clinicId, patientId, toothNumber, status);
    } catch {
        return { success: false, error: 'Starea dintelui nu a putut fi salvată.' };
    }
    revalidatePath(`/pacienti/${patientId}`);
    return { success: true };
}
