// Interogările dashboard-ului, primind clinicId ca parametru.
// Fișierul NU are 'use server': altfel funcțiile de aici ar deveni endpoint-uri
// apelabile din browser cu ORICE clinicId. Se apelează doar din src/lib/actions/dashboard.ts,
// care ia clinicId din sesiune (getCurrentUser).

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getAvailableMonths, resolvePeriod, todayInClinic, type DashboardPeriod } from '@/lib/dashboard-period';
import { getClinicCreatedOn, localDate, localDateUtc, num, TZ } from '@/lib/db/sql-helpers';
import type { AppointmentStatus } from '@/lib/db/schema';

// Toate agregările se fac în SQL; helperii pentru ziua locală sunt în sql-helpers.ts

// Pentru "De la început" nu există perioadă anterioară; folosim o dată imposibilă ca filtrele să dea 0
const NO_DATE = '1900-01-01';

async function getKpis(clinicId: string, period: DashboardPeriod) {
    const prevFrom = period.previous?.from ?? NO_DATE;
    const prevTo = period.previous?.to ?? NO_DATE;

    const [patients, appointments, money] = await Promise.all([
        // Pacienți totali = înregistrați până la sfârșitul perioadei (valoare cumulată)
        db.execute(sql`
            select
                count(*) filter (where ${localDateUtc('created_at')} <= ${period.to}::date) as current,
                count(*) filter (where ${localDateUtc('created_at')} <= ${prevTo}::date) as previous
            from patients where clinic_id = ${clinicId}`),
        // Programări în perioadă, fără cele anulate
        db.execute(sql`
            select
                count(*) filter (where ${localDate('starts_at')} between ${period.from}::date and ${period.to}::date) as current,
                count(*) filter (where ${localDate('starts_at')} between ${prevFrom}::date and ${prevTo}::date) as previous
            from appointments where clinic_id = ${clinicId} and status <> 'anulat'`),
        // Venit = încasat în perioadă (după paid_at).
        // Datorii la ziua T = tratamente efectuate până la T și neachitate până la T.
        db.execute(sql`
            select
                coalesce(sum(price) filter (where ${localDate('paid_at')} between ${period.from}::date and ${period.to}::date), 0) as revenue_current,
                coalesce(sum(price) filter (where ${localDate('paid_at')} between ${prevFrom}::date and ${prevTo}::date), 0) as revenue_previous,
                coalesce(sum(price) filter (where performed_at <= ${period.to}::date
                    and (paid_at is null or ${localDate('paid_at')} > ${period.to}::date)), 0) as debt_current,
                coalesce(sum(price) filter (where performed_at <= ${prevTo}::date
                    and (paid_at is null or ${localDate('paid_at')} > ${prevTo}::date)), 0) as debt_previous,
                count(distinct patient_id) filter (where performed_at <= ${period.to}::date
                    and (paid_at is null or ${localDate('paid_at')} > ${period.to}::date)) as debtors
            from treatments where clinic_id = ${clinicId}`),
    ]);

    const hasPrevious = period.previous !== null;
    const previousOrNull = (value: unknown) => (hasPrevious ? num(value) : null);
    const [p] = patients, [a] = appointments, [m] = money;
    return {
        patients: { current: num(p.current), previous: previousOrNull(p.previous) },
        appointments: { current: num(a.current), previous: previousOrNull(a.previous) },
        revenue: { current: num(m.revenue_current), previous: previousOrNull(m.revenue_previous) },
        debt: { current: num(m.debt_current), previous: previousOrNull(m.debt_previous), debtors: num(m.debtors) },
    };
}

// Încasări pe zi (sau pe lună la "De la început"). generate_series produce toate zilele,
// inclusiv cele fără încasări (0), ca axa graficului să fie continuă.
async function getRevenueSeries(clinicId: string, period: DashboardPeriod) {
    const step = period.granularity === 'day' ? sql`interval '1 day'` : sql`interval '1 month'`;
    const bucket = period.granularity === 'day'
        ? sql`${localDate('t.paid_at')}`
        : sql`date_trunc('month', ${localDate('t.paid_at')})::date`;
    const start = period.granularity === 'day'
        ? sql`${period.from}::date`
        : sql`date_trunc('month', ${period.from}::date)::date`;

    const rows = await db.execute(sql`
        select to_char(d.day, 'YYYY-MM-DD') as date, coalesce(sum(t.price), 0) as total
        from generate_series(${start}, ${period.to}::date, ${step}) as d(day)
        left join treatments t
            on t.clinic_id = ${clinicId}
            and t.paid_at is not null
            and ${bucket} = d.day::date
            and ${localDate('t.paid_at')} between ${period.from}::date and ${period.to}::date
        group by d.day
        order by d.day`);
    return rows.map((row) => ({ date: String(row.date), total: num(row.total) }));
}

// Top 5 servicii după numărul de tratamente din perioadă + "Altele" pentru rest
async function getTopTreatments(clinicId: string, period: DashboardPeriod) {
    const rows = await db.execute(sql`
        select coalesce(s.name, t.treatment_description) as name, count(*) as count, coalesce(sum(t.price), 0) as total
        from treatments t
        left join services s on s.id = t.service_id
        where t.clinic_id = ${clinicId}
            and t.performed_at between ${period.from}::date and ${period.to}::date
        group by 1
        order by count desc, total desc`);

    const groups = rows.map((row) => ({ name: String(row.name), count: num(row.count), total: num(row.total) }));
    const top = groups.slice(0, 5);
    const rest = groups.slice(5);
    if (rest.length > 0) {
        top.push({
            name: 'Altele',
            count: rest.reduce((sum, group) => sum + group.count, 0),
            total: rest.reduce((sum, group) => sum + group.total, 0),
        });
    }
    return top;
}

async function getTodayAppointments(clinicId: string, today: string) {
    const rows = await db.execute(sql`
        select a.id, to_char(a.starts_at at time zone ${TZ}, 'HH24:MI') as time, a.duration_minutes, a.reason, a.status,
            p.id as patient_id, p.last_name || ' ' || p.first_name as patient_name,
            d.last_name || ' ' || d.first_name as doctor_name, d.color as doctor_color
        from appointments a
        join patients p on p.id = a.patient_id
        left join doctors d on d.id = a.doctor_id
        where a.clinic_id = ${clinicId} and ${localDate('a.starts_at')} = ${today}::date
        order by a.starts_at`);
    return rows.map((row) => ({
        id: String(row.id),
        time: String(row.time),
        durationMinutes: num(row.duration_minutes),
        reason: row.reason as string | null,
        status: row.status as AppointmentStatus,
        patientId: String(row.patient_id),
        patientName: String(row.patient_name),
        doctorName: row.doctor_name as string | null,
        doctorColor: row.doctor_color as string | null,
    }));
}

export type ActivityItem =
    | { type: 'treatment'; id: string; at: string; patientId: string; patientName: string; title: string; price: number; paid: boolean }
    | { type: 'patient'; id: string; at: string; patientId: string; patientName: string };

// Ultimele tratamente și pacienți noi, combinate și sortate după momentul adăugării
async function getRecentActivity(clinicId: string, limit = 6): Promise<ActivityItem[]> {
    const [treatmentRows, patientRows] = await Promise.all([
        db.execute(sql`
            select t.id, t.created_at at time zone 'UTC' as at, t.patient_id, p.last_name || ' ' || p.first_name as patient_name,
                coalesce(s.name, t.treatment_description) as title, t.price, t.paid
            from treatments t
            join patients p on p.id = t.patient_id
            left join services s on s.id = t.service_id
            where t.clinic_id = ${clinicId}
            order by t.created_at desc limit ${limit}`),
        db.execute(sql`
            select id, created_at at time zone 'UTC' as at, last_name || ' ' || first_name as patient_name
            from patients where clinic_id = ${clinicId}
            order by created_at desc limit ${limit}`),
    ]);

    const items: ActivityItem[] = [
        ...treatmentRows.map((row) => ({
            type: 'treatment' as const,
            id: String(row.id),
            at: new Date(row.at as string).toISOString(),
            patientId: String(row.patient_id),
            patientName: String(row.patient_name),
            title: String(row.title),
            price: num(row.price),
            paid: Boolean(row.paid),
        })),
        ...patientRows.map((row) => ({
            type: 'patient' as const,
            id: String(row.id),
            at: new Date(row.at as string).toISOString(),
            patientId: String(row.id),
            patientName: String(row.patient_name),
        })),
    ];
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

// `today` se poate da explicit (pentru teste); implicit e ziua curentă în ora Chișinăului
export async function getDashboardDataForClinic(clinicId: string, periodKey: string | undefined, today = todayInClinic()) {
    const clinicCreatedOn = await getClinicCreatedOn(clinicId);
    const period = resolvePeriod(periodKey, clinicCreatedOn, today);

    const [kpis, revenueSeries, topTreatments, todayAppointments, recentActivity] = await Promise.all([
        getKpis(clinicId, period),
        getRevenueSeries(clinicId, period),
        getTopTreatments(clinicId, period),
        getTodayAppointments(clinicId, today),
        getRecentActivity(clinicId),
    ]);

    return {
        period,
        months: getAvailableMonths(clinicCreatedOn, today),
        kpis,
        revenueSeries,
        topTreatments,
        todayAppointments,
        recentActivity,
    };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardDataForClinic>>;
