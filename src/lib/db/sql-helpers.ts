// Helperi SQL comuni pentru interogările de agregare (dashboard, rapoarte).
// Datele se compară ca zile în ora Chișinăului:
// - coloane timestamptz (paid_at, starts_at): (col at time zone TZ)::date
// - coloane timestamp fără fus (created_at, salvat în UTC de now()): (col at time zone 'UTC' at time zone TZ)::date

import { sql } from 'drizzle-orm';
import { CLINIC_TIME_ZONE } from '@/lib/dashboard-period';
import { db } from '@/lib/db';

export const TZ = sql.raw(`'${CLINIC_TIME_ZONE}'`);
export const localDate = (column: string) => sql.raw(`(${column} at time zone '${CLINIC_TIME_ZONE}')::date`);
export const localDateUtc = (column: string) => sql.raw(`(${column} at time zone 'UTC' at time zone '${CLINIC_TIME_ZONE}')::date`);

// Postgres întoarce sum()/count() ca text (numeric/bigint); le convertim la number
export const num = (value: unknown) => Number(value ?? 0);

// Data creării clinicii ('YYYY-MM-DD', ora Chișinăului), folosită de perioadele din dashboard și rapoarte.
// Nu se schimbă niciodată, deci o ținem în memoria serverului după prima citire: fără ea, fiecare
// încărcare de dashboard / raport aștepta o interogare în plus (~80 ms) înaintea celorlalte.
const clinicCreatedOnCache = new Map<string, string>();

export async function getClinicCreatedOn(clinicId: string): Promise<string> {
    const cached = clinicCreatedOnCache.get(clinicId);
    if (cached) return cached;
    const [clinic] = await db.execute(sql`
        select to_char(${localDateUtc('created_at')}, 'YYYY-MM-DD') as created_on from clinics where id = ${clinicId}`);
    const createdOn = String(clinic.created_on);
    clinicCreatedOnCache.set(clinicId, createdOn);
    return createdOn;
}

// O datorie = tratament neachitat cu preț (tratamentele gratuite nu sunt datorii). Tabelul trebuie să aibă aliasul t.
export const UNPAID = sql.raw('not t.paid and coalesce(t.price, 0) > 0');

// Pragul implicit pentru „De rechemat” (raportul Programări și alerta implicită)
export const RECALL_MONTHS = 6;

// De rechemat: pacienți activi a căror ultimă vizită (tratament sau programare finalizată)
// e mai veche de `months` luni și care nu au nicio programare viitoare.
// Folosită de raportul Programări și de alerta din clopoțel, ca ambele să dea aceleași cifre.
export function getRecallPatients(clinicId: string, today: string, months: number) {
    return db.execute(sql`
        select p.id, p.record_number, p.last_name || ' ' || p.first_name as name, p.phone, v.last_visit::text as last_visit,
            (extract(year from age(${today}::date, v.last_visit)) * 12 + extract(month from age(${today}::date, v.last_visit))) as months
        from patients p
        join lateral (
            select greatest(
                (select max(t.performed_at) from treatments t where t.patient_id = p.id),
                (select max(${localDate('a.starts_at')}) from appointments a where a.patient_id = p.id and a.status = 'finalizat')
            ) as last_visit
        ) v on true
        where p.clinic_id = ${clinicId} and p.status = 'activ'
            and v.last_visit < ${today}::date - make_interval(months => ${months}::int)
            and not exists (
                select 1 from appointments a
                where a.patient_id = p.id and a.starts_at > now() and a.status in ('programat', 'confirmat'))
        order by v.last_visit`);
}
