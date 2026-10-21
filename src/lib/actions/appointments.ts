'use server';

import { and, asc, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { appointments, doctors, patients, services } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isDoctorInClinic, isPatientInClinic } from '@/lib/db/ownership';
import { patientSearchCondition } from '@/lib/db/patient-search';
import { nextRecordNumber } from '@/lib/db/patient-record';
import { CLINIC_TIME_ZONE, addDays, todayInClinic } from '@/lib/dashboard-period';
import { appointmentSchema, type AppointmentFormData } from '@/lib/validations/appointment';

const INVALID_DATA = 'Datele introduse nu sunt valide. Verificați câmpurile completate.';
const TZ = sql.raw(`'${CLINIC_TIME_ZONE}'`);

// Data și ora din formular sunt în ora Chișinăului. Postgres le transformă în momentul exact (timestamptz),
// ținând cont de ora de vară — rezultatul nu depinde de fusul orar al serverului.
const clinicMoment = (date: string, time: string) => sql`${`${date} ${time}`}::timestamp at time zone ${TZ}`;

// Programările dintr-un interval de zile (inclusiv), pentru calendar.
// Ziua și ora se calculează în SQL în ora Chișinăului, la fel ca în dashboard.
export async function getAppointments({ from, to, doctorId }: { from: string; to: string; doctorId?: string }) {
    const { clinicId } = await getCurrentUser();
    const conditions = [
        eq(appointments.clinicId, clinicId),
        sql`${appointments.startsAt} >= ${clinicMoment(from, '00:00')}`,
        sql`${appointments.startsAt} < ${clinicMoment(addDays(to, 1), '00:00')}`,
    ];
    if (doctorId) conditions.push(eq(appointments.doctorId, doctorId));

    return db
        .select({
            id: appointments.id,
            date: sql<string>`to_char(${appointments.startsAt} at time zone ${TZ}, 'YYYY-MM-DD')`,
            time: sql<string>`to_char(${appointments.startsAt} at time zone ${TZ}, 'HH24:MI')`,
            durationMinutes: appointments.durationMinutes,
            status: appointments.status,
            reason: appointments.reason,
            notes: appointments.notes,
            patientId: appointments.patientId,
            patientName: sql<string>`${patients.lastName} || ' ' || ${patients.firstName}`,
            patientPhone: patients.phone,
            doctorId: appointments.doctorId,
            doctorColor: doctors.color,
            serviceId: appointments.serviceId,
            serviceName: services.name,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        // leftJoin: programarea apare și dacă medicul/serviciul a fost șters
        .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
        .leftJoin(services, eq(appointments.serviceId, services.id))
        .where(and(...conditions))
        .orderBy(asc(appointments.startsAt));
}

export type CalendarAppointment = Awaited<ReturnType<typeof getAppointments>>[number];

// Căutare rapidă pentru câmpul „Pacient” din formular (doar pacienți activi)
export async function searchPatients(q: string) {
    const { clinicId } = await getCurrentUser();
    if (q.trim().length < 2) return [];
    return db
        .select({
            id: patients.id,
            name: sql<string>`${patients.lastName} || ' ' || ${patients.firstName}`,
            phone: patients.phone,
        })
        .from(patients)
        .where(and(eq(patients.clinicId, clinicId), eq(patients.status, 'activ'), patientSearchCondition(q)))
        .orderBy(asc(patients.lastName), asc(patients.firstName))
        .limit(10);
}

async function findService(serviceId: string, clinicId: string) {
    const [service] = await db
        .select({ id: services.id, active: services.active, durationMinutes: services.durationMinutes })
        .from(services)
        .where(and(eq(services.id, serviceId), eq(services.clinicId, clinicId)))
        .limit(1);
    return service ?? null;
}

// Același medic nu poate avea două programări (ne-anulate) care se suprapun.
// Două intervale se suprapun dacă fiecare începe înainte ca celălalt să se termine.
async function findConflict(params: {
    clinicId: string; doctorId: string; date: string; time: string; durationMinutes: number; excludeId?: string;
}): Promise<string | null> {
    const start = clinicMoment(params.date, params.time);
    const rows = await db.execute(sql`
        select to_char(a.starts_at at time zone ${TZ}, 'HH24:MI') as start_time,
            to_char((a.starts_at + a.duration_minutes * interval '1 minute') at time zone ${TZ}, 'HH24:MI') as end_time,
            d.last_name as doctor_name
        from appointments a
        join doctors d on d.id = a.doctor_id
        where a.clinic_id = ${params.clinicId}
            and a.doctor_id = ${params.doctorId}
            and a.status <> 'anulat'
            ${params.excludeId ? sql`and a.id <> ${params.excludeId}` : sql``}
            and a.starts_at < ${start} + ${params.durationMinutes}::int * interval '1 minute'
            and a.starts_at + a.duration_minutes * interval '1 minute' > ${start}
        order by a.starts_at
        limit 1`);
    const [row] = rows;
    return row ? `Dr. ${row.doctor_name} are deja o programare la ${row.start_time}–${row.end_time}.` : null;
}

function revalidateCalendar() {
    revalidatePath('/programari');
    revalidatePath('/'); // „Programări azi” din dashboard
    revalidatePath('/pacienti'); // poate apărea un pacient nou, creat din programare
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Pacientul programării: cel ales din listă sau unul nou, creat acum doar cu nume + telefon.
// Pacientul nou nu are IDNP, deci fișa lui apare ca „Date incomplete” până se completează.
async function resolvePatientId(tx: Tx, data: AppointmentFormData, clinicId: string, userId: string) {
    if (!data.newPatient) return data.patientId;
    const [created] = await tx.insert(patients)
        .values({ ...data.newPatient, clinicId, createdBy: userId, recordNumber: nextRecordNumber(clinicId) })
        .returning({ id: patients.id });
    return created.id;
}

// Verificările comune pentru creare și editare. Întoarce durata (din serviciu) sau un mesaj de eroare.
async function prepare(data: AppointmentFormData, clinicId: string, existing?: { id: string; serviceId: string | null; durationMinutes: number }) {
    if (!data.newPatient && !(await isPatientInClinic(data.patientId, clinicId))) return { error: 'Pacientul nu există.' };
    if (data.doctorId && !(await isDoctorInClinic(data.doctorId, clinicId))) return { error: 'Medicul selectat nu există.' };

    const service = await findService(data.serviceId, clinicId);
    if (!service) return { error: 'Procedura selectată nu există.' };
    const serviceChanged = data.serviceId !== existing?.serviceId;
    // Un serviciu dezactivat nu mai poate fi ales, dar o programare veche care îl are poate fi editată
    if (!service.active && serviceChanged) return { error: 'Procedura selectată nu mai este activă.' };

    // Durata vine din Setări → Servicii. La editare se recalculează doar dacă s-a schimbat procedura.
    const durationMinutes = serviceChanged || !existing ? service.durationMinutes : existing.durationMinutes;

    if (data.doctorId && data.status !== 'anulat') {
        const conflict = await findConflict({
            clinicId, doctorId: data.doctorId, date: data.date, time: data.time, durationMinutes, excludeId: existing?.id,
        });
        if (conflict) return { error: conflict };
    }
    return { durationMinutes };
}

function toDbValues(data: AppointmentFormData, patientId: string, durationMinutes: number) {
    return {
        patientId,
        doctorId: data.doctorId || null,
        serviceId: data.serviceId,
        startsAt: clinicMoment(data.date, data.time),
        durationMinutes,
        reason: data.reason || null,
        notes: data.notes || null,
        status: data.status,
    };
}

export async function createAppointment(data: AppointmentFormData) {
    const { id: userId, clinicId } = await getCurrentUser();
    const result = appointmentSchema.safeParse(data);
    if (!result.success) return { success: false, error: INVALID_DATA };
    const validated = result.data;

    try {
        const prepared = await prepare(validated, clinicId);
        if ('error' in prepared) return { success: false, error: prepared.error };
        // Pacientul nou și programarea se salvează împreună: ori amândouă, ori niciuna
        await db.transaction(async (tx) => {
            const patientId = await resolvePatientId(tx, validated, clinicId, userId);
            await tx.insert(appointments).values({
                ...toDbValues(validated, patientId, prepared.durationMinutes),
                clinicId,
                createdBy: userId,
            });
        });
    } catch {
        return { success: false, error: 'Programarea nu a putut fi salvată. Încearcă din nou.' };
    }

    revalidateCalendar();
    return { success: true };
}

export async function updateAppointment(id: string, data: AppointmentFormData) {
    const { id: userId, clinicId } = await getCurrentUser();
    const result = appointmentSchema.safeParse(data);
    if (!result.success || !z.uuid().safeParse(id).success) return { success: false, error: INVALID_DATA };
    const validated = result.data;

    try {
        const [existing] = await db
            .select({ id: appointments.id, serviceId: appointments.serviceId, durationMinutes: appointments.durationMinutes })
            .from(appointments)
            .where(and(eq(appointments.id, id), eq(appointments.clinicId, clinicId)))
            .limit(1);
        if (!existing) return { success: false, error: 'Programarea nu există.' };

        const prepared = await prepare(validated, clinicId, existing);
        if ('error' in prepared) return { success: false, error: prepared.error };
        await db.transaction(async (tx) => {
            const patientId = await resolvePatientId(tx, validated, clinicId, userId);
            await tx.update(appointments)
                .set(toDbValues(validated, patientId, prepared.durationMinutes))
                .where(and(eq(appointments.id, id), eq(appointments.clinicId, clinicId)));
        });
    } catch {
        return { success: false, error: 'Modificările nu au putut fi salvate. Încearcă din nou.' };
    }

    revalidateCalendar();
    return { success: true };
}

export async function deleteAppointment(id: string) {
    const { clinicId } = await getCurrentUser();
    try {
        await db.delete(appointments).where(and(eq(appointments.id, id), eq(appointments.clinicId, clinicId)));
    } catch {
        return { success: false, error: 'Programarea nu a putut fi ștearsă.' };
    }
    revalidateCalendar();
    return { success: true };
}

// Ce se completează automat la „Tratament nou” din programările pacientului.
// 1. Programarea încă nefinalizată (programat / confirmat) de azi sau din trecut, cea mai apropiată de ora
//    curentă -> data, medicul și procedura (+ motivul și notele, afișate ca informație). E aceeași programare
//    pe care salvarea tratamentului o marchează „Finalizat” (finishAppointmentFor din actions/treatments.ts).
// 2. Altfel, doar medicul din cea mai recentă programare (azi întâi), fără anulate / neprezentate.
// Medicii și serviciile inactive nu se propun. null = nimic de completat.
export async function getTreatmentPrefill(patientId: string): Promise<TreatmentPrefill | null> {
    const { clinicId } = await getCurrentUser();
    if (!z.uuid().safeParse(patientId).success) return null;
    const today = todayInClinic();
    const localDate = sql`(a.starts_at at time zone ${TZ})::date`;
    // Azi întâi, apoi cea mai apropiată de momentul de acum
    const closest = sql`${localDate} = ${today}::date desc, abs(extract(epoch from a.starts_at - now()))`;

    const [pending] = await db.execute(sql`
        select to_char(a.starts_at at time zone ${TZ}, 'YYYY-MM-DD') as date,
            to_char(a.starts_at at time zone ${TZ}, 'HH24:MI') as time,
            d.id as doctor_id, d.last_name as doctor_name, s.id as service_id, a.reason, a.notes
        from appointments a
        left join doctors d on d.id = a.doctor_id and d.active
        left join services s on s.id = a.service_id and s.active
        where a.clinic_id = ${clinicId}
            and a.patient_id = ${patientId}
            and a.status in ('programat', 'confirmat')
            and ${localDate} <= ${today}::date
        order by ${closest}
        limit 1`);
    if (pending) {
        return {
            doctorId: pending.doctor_id ? String(pending.doctor_id) : null,
            appointment: {
                date: String(pending.date),
                time: String(pending.time),
                doctorName: pending.doctor_name ? String(pending.doctor_name) : null,
                serviceId: pending.service_id ? String(pending.service_id) : null,
                reason: pending.reason ? String(pending.reason) : null,
                notes: pending.notes ? String(pending.notes) : null,
            },
        };
    }

    const [latest] = await db.execute(sql`
        select a.doctor_id
        from appointments a
        join doctors d on d.id = a.doctor_id and d.active
        where a.clinic_id = ${clinicId}
            and a.patient_id = ${patientId}
            and a.status not in ('anulat', 'neprezentat')
            and ${localDate} <= ${today}::date
        order by ${closest}
        limit 1`);
    return latest ? { doctorId: String(latest.doctor_id), appointment: null } : null;
}

export interface TreatmentPrefill {
    doctorId: string | null;
    // null = nu există o programare nefinalizată; se propune doar medicul
    appointment: {
        date: string;
        time: string;
        doctorName: string | null;
        serviceId: string | null;
        reason: string | null;
        notes: string | null;
    } | null;
}
