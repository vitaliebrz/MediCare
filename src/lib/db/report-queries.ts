// Interogările paginii Rapoarte, primind clinicId ca parametru.
// Fișierul NU are 'use server' (vezi dashboard-queries.ts): se apelează doar din src/lib/actions/reports.ts
// și din rutele de export, care iau clinicId din sesiune.
// Definițiile (Facturat, Încasat, Datorie...) sunt în docs/plans/rapoarte.md și sunt aceleași în tot raportul.
//
// Atenție: în SQL-ul scris direct folosim aliasuri explicite (t.patient_id = p.id), nu ${tabel.coloana}:
// într-un select pe un singur tabel Drizzle scrie coloana fără numele tabelului, iar într-o subinterogare
// ar putea fi confundată cu o coloană a altui tabel.

import { sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getAvailableMonths, resolvePeriod, todayInClinic, type DashboardPeriod } from '@/lib/dashboard-period';
import { localDate, localDateUtc, num, TZ } from '@/lib/db/sql-helpers';
import type { ReportBase, ReportKind, ReportTable } from '@/lib/reports/types';
import { WEEKDAYS_SHORT } from '@/lib/calendar';

interface ReportContext {
    clinicId: string;
    period: DashboardPeriod;
    today: string;
    doctorId?: string; // filtrul „medic” (deja verificat că e al clinicii)
}

// Condiții refolosite: tratament efectuat / achitat în perioadă, filtrul de medic
const performedIn = (ctx: ReportContext) => sql`t.performed_at between ${ctx.period.from}::date and ${ctx.period.to}::date`;
const paidIn = (ctx: ReportContext) => sql`${localDate('t.paid_at')} between ${ctx.period.from}::date and ${ctx.period.to}::date`;
const byDoctor = (ctx: ReportContext, column = 't.doctor_id'): SQL => (ctx.doctorId ? sql`and ${sql.raw(column)} = ${ctx.doctorId}` : sql``);
// O datorie = tratament neachitat cu preț (tratamentele gratuite nu sunt datorii)
const UNPAID = sql.raw('not t.paid and coalesce(t.price, 0) > 0');

const percent = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

// ====================================================
// 1. Financiar + Datorii
// ====================================================

export const AGING_BUCKETS = ['0–30 zile', '31–60 zile', '61–90 zile', 'peste 90 de zile'] as const;

async function getFinancialReport(ctx: ReportContext) {
    const { clinicId, period, today } = ctx;
    const step = period.granularity === 'day' ? sql`interval '1 day'` : sql`interval '1 month'`;
    const bucket = (date: SQL) => (period.granularity === 'day' ? date : sql`date_trunc('month', ${date})::date`);
    const start = period.granularity === 'day' ? sql`${period.from}::date` : sql`date_trunc('month', ${period.from}::date)::date`;

    const [[kpis], series, categories, aging, debtors] = await Promise.all([
        db.execute(sql`
            select
                coalesce(sum(t.price) filter (where ${performedIn(ctx)}), 0) as billed,
                coalesce(sum(t.price) filter (where ${paidIn(ctx)}), 0) as collected,
                coalesce(sum(t.price) filter (where ${performedIn(ctx)} and t.paid), 0) as billed_paid,
                coalesce(sum(t.price) filter (where ${UNPAID}), 0) as debt,
                count(distinct t.patient_id) filter (where ${UNPAID}) as debtors
            from treatments t
            where t.clinic_id = ${clinicId} ${byDoctor(ctx)}`),

        // generate_series: toate zilele/lunile perioadei, inclusiv cele fără sume (0), ca axa să fie continuă
        db.execute(sql`
            select to_char(d.day, 'YYYY-MM-DD') as date,
                (select coalesce(sum(t.price), 0) from treatments t
                    where t.clinic_id = ${clinicId} ${byDoctor(ctx)}
                        and ${performedIn(ctx)} and ${bucket(sql`t.performed_at`)} = d.day::date) as billed,
                (select coalesce(sum(t.price), 0) from treatments t
                    where t.clinic_id = ${clinicId} ${byDoctor(ctx)}
                        and ${paidIn(ctx)} and ${bucket(localDate('t.paid_at'))} = d.day::date) as collected
            from generate_series(${start}, ${period.to}::date, ${step}) as d(day)
            order by d.day`),

        // Un tratament intră dacă a fost efectuat SAU achitat în perioadă; fiecare sumă își are filtrul ei
        db.execute(sql`
            select coalesce(c.name, 'Fără serviciu ales') as category,
                count(*) filter (where ${performedIn(ctx)}) as count,
                coalesce(sum(t.price) filter (where ${performedIn(ctx)}), 0) as billed,
                coalesce(sum(t.price) filter (where ${paidIn(ctx)}), 0) as collected
            from treatments t
            left join services s on s.id = t.service_id
            left join categories c on c.id = s.category_id
            where t.clinic_id = ${clinicId} ${byDoctor(ctx)} and (${performedIn(ctx)} or ${paidIn(ctx)})
            group by 1
            order by billed desc, collected desc`),

        // Vechimea: zile de la efectuarea tratamentului neachitat până azi
        db.execute(sql`
            select case
                    when ${today}::date - t.performed_at <= 30 then 0
                    when ${today}::date - t.performed_at <= 60 then 1
                    when ${today}::date - t.performed_at <= 90 then 2
                    else 3 end as bucket,
                coalesce(sum(t.price), 0) as amount,
                count(distinct t.patient_id) as patients
            from treatments t
            where t.clinic_id = ${clinicId} and ${UNPAID} ${byDoctor(ctx)}
            group by 1`),

        db.execute(sql`
            select p.id, p.record_number, p.last_name || ' ' || p.first_name as name, p.phone,
                count(*) as count,
                min(t.performed_at)::text as oldest,
                ${today}::date - min(t.performed_at) as days,
                sum(t.price) as amount
            from treatments t
            join patients p on p.id = t.patient_id
            where t.clinic_id = ${clinicId} and ${UNPAID} ${byDoctor(ctx)}
            group by p.id
            order by amount desc, oldest`),
    ]);

    const billed = num(kpis.billed);
    const collected = num(kpis.collected);
    const debt = num(kpis.debt);

    const agingRows = AGING_BUCKETS.map((label, index) => {
        const row = aging.find((item) => num(item.bucket) === index);
        return { label, amount: num(row?.amount), patients: num(row?.patients) };
    });

    const categoriesTable: ReportTable = {
        id: 'categorii',
        title: 'Pe categorii de servicii',
        description: 'Facturat = tratamente efectuate în perioadă · Încasat = plăți primite în perioadă',
        columns: [
            { key: 'category', label: 'Categorie', format: 'text' },
            { key: 'count', label: 'Tratamente', format: 'int' },
            { key: 'billed', label: 'Facturat', format: 'money' },
            { key: 'collected', label: 'Încasat', format: 'money' },
            { key: 'share', label: '% din facturat', format: 'percent' },
        ],
        rows: categories.map((row) => ({
            cells: {
                category: String(row.category),
                count: num(row.count),
                billed: num(row.billed),
                collected: num(row.collected),
                share: percent(num(row.billed), billed),
            },
        })),
        totals: {
            category: 'Total',
            count: categories.reduce((sum, row) => sum + num(row.count), 0),
            billed,
            collected,
            share: billed > 0 ? 100 : 0,
        },
        emptyText: 'Niciun tratament efectuat sau achitat în această perioadă.',
    };

    const agingTable: ReportTable = {
        id: 'vechime-datorii',
        title: 'Vechimea datoriilor (la zi)',
        description: 'Zile de la efectuarea tratamentului neachitat până azi',
        columns: [
            { key: 'label', label: 'Vechime', format: 'text' },
            { key: 'patients', label: 'Pacienți', format: 'int' },
            { key: 'amount', label: 'Sumă', format: 'money' },
            { key: 'share', label: '% din datorii', format: 'percent' },
        ],
        rows: agingRows.map((row) => ({ cells: { ...row, share: percent(row.amount, debt) } })),
        totals: { label: 'Total', patients: num(kpis.debtors), amount: debt, share: debt > 0 ? 100 : 0 },
        emptyText: 'Nicio datorie.',
    };

    const debtorsTable: ReportTable = {
        id: 'debitori',
        title: 'Debitori (la zi)',
        description: 'Pacienții cu tratamente neachitate, de la cea mai mare sumă',
        columns: [
            { key: 'patient', label: 'Pacient', format: 'text' },
            { key: 'recordNumber', label: 'Nr. fișă', format: 'int' },
            { key: 'phone', label: 'Telefon', format: 'text' },
            { key: 'count', label: 'Tratamente neachitate', format: 'int' },
            { key: 'oldest', label: 'Cea mai veche datorie', format: 'date' },
            { key: 'days', label: 'Zile', format: 'int' },
            { key: 'amount', label: 'Sumă', format: 'money' },
        ],
        rows: debtors.map((row) => ({
            href: `/pacienti/${row.id}`,
            cells: {
                patient: String(row.name),
                recordNumber: row.record_number === null ? null : num(row.record_number),
                phone: row.phone ? String(row.phone) : null,
                count: num(row.count),
                oldest: String(row.oldest),
                days: num(row.days),
                amount: num(row.amount),
            },
        })),
        totals: { patient: 'Total', count: debtors.reduce((sum, row) => sum + num(row.count), 0), amount: debt },
        emptyText: 'Nicio datorie. Toate tratamentele sunt achitate.',
    };

    return {
        kind: 'financiar' as const,
        title: 'Financiar și datorii',
        period,
        kpis: [
            { label: 'Facturat', value: billed, format: 'money' as const, hint: 'tratamente efectuate în perioadă' },
            { label: 'Încasat', value: collected, format: 'money' as const, hint: 'plăți primite în perioadă' },
            { label: 'Rata de încasare', value: percent(num(kpis.billed_paid), billed), format: 'percent' as const, hint: 'din facturatul perioadei, achitat până azi' },
            { label: 'Datorii totale', value: debt, format: 'money' as const, hint: 'la zi' },
            { label: 'Debitori', value: num(kpis.debtors), format: 'int' as const, hint: 'pacienți cu datorii' },
        ],
        tables: [categoriesTable, agingTable, debtorsTable],
        series: series.map((row) => ({ date: String(row.date), billed: num(row.billed), collected: num(row.collected) })),
        aging: agingRows,
    } satisfies ReportBase & Record<string, unknown>;
}

export type FinancialReport = Awaited<ReturnType<typeof getFinancialReport>>;

// ====================================================
// 2. Medici
// ====================================================

const NO_DOCTOR = 'fara-medic';

async function getDoctorsReport(ctx: ReportContext) {
    const { clinicId } = ctx;
    const [doctorRows, treatmentStats, appointmentStats, [overall]] = await Promise.all([
        db.execute(sql`select id, last_name, first_name, color, active from doctors where clinic_id = ${clinicId} order by last_name, first_name`),

        // Pe medicul tratamentului; un tratament intră dacă a fost efectuat SAU achitat în perioadă
        db.execute(sql`
            select coalesce(t.doctor_id::text, ${NO_DOCTOR}) as doctor,
                count(*) filter (where ${performedIn(ctx)}) as treatments,
                count(distinct t.patient_id) filter (where ${performedIn(ctx)}) as patients,
                coalesce(sum(t.price) filter (where ${performedIn(ctx)}), 0) as billed,
                coalesce(sum(t.price) filter (where ${paidIn(ctx)}), 0) as collected
            from treatments t
            where t.clinic_id = ${clinicId} and (${performedIn(ctx)} or ${paidIn(ctx)})
            group by 1`),

        db.execute(sql`
            select coalesce(a.doctor_id::text, ${NO_DOCTOR}) as doctor,
                count(*) as total,
                count(*) filter (where a.status = 'finalizat') as done,
                count(*) filter (where a.status = 'anulat') as cancelled,
                count(*) filter (where a.status = 'neprezentat') as no_show
            from appointments a
            where a.clinic_id = ${clinicId}
                and ${localDate('a.starts_at')} between ${ctx.period.from}::date and ${ctx.period.to}::date
            group by 1`),

        // Pacienții unici pe total (nu se pot aduna pe medici: un pacient poate merge la doi medici)
        db.execute(sql`
            select count(distinct t.patient_id) as patients from treatments t
            where t.clinic_id = ${clinicId} and ${performedIn(ctx)}`),
    ]);

    const statsFor = (key: string) => ({
        treatment: treatmentStats.find((row) => row.doctor === key),
        appointment: appointmentStats.find((row) => row.doctor === key),
    });
    // Medicii activi apar mereu; cei inactivi și „Fără medic” doar dacă au date în perioadă
    const entries = [
        ...doctorRows.map((doctor) => ({
            key: String(doctor.id),
            // trim: unele nume au spații în plus, salvate din formular
            name: `Dr. ${String(doctor.last_name).trim()} ${String(doctor.first_name).trim()}`.replace(/\s+/g, ' '),
            color: String(doctor.color),
            active: Boolean(doctor.active),
        })),
        { key: NO_DOCTOR, name: 'Fără medic', color: null, active: false },
    ]
        .map((entry) => ({ ...entry, ...statsFor(entry.key) }))
        .filter((entry) => entry.active || entry.treatment || entry.appointment);

    const rows = entries.map(({ key, name, color, treatment, appointment }) => {
        const treatments = num(treatment?.treatments);
        const billedValue = num(treatment?.billed);
        const appointments = num(appointment?.total);
        return {
            key, name, color, billed: billedValue,
            cells: {
                doctor: name,
                treatments,
                patients: num(treatment?.patients),
                billed: billedValue,
                collected: num(treatment?.collected),
                average: treatments > 0 ? billedValue / treatments : null,
                appointments,
                done: num(appointment?.done),
                cancelRate: appointments > 0 ? percent(num(appointment?.cancelled), appointments) : null,
                noShowRate: appointments > 0 ? percent(num(appointment?.no_show), appointments) : null,
            },
        };
    }).sort((a, b) => b.billed - a.billed);

    const sum = (key: string) => rows.reduce((total, row) => total + Number(row.cells[key as keyof typeof row.cells] ?? 0), 0);
    const totalTreatments = sum('treatments');
    const totalBilled = sum('billed');
    const totalAppointments = sum('appointments');
    const totalCancelled = appointmentStats.reduce((total, row) => total + num(row.cancelled), 0);
    const totalNoShow = appointmentStats.reduce((total, row) => total + num(row.no_show), 0);

    const table: ReportTable = {
        id: 'medici',
        title: 'Activitatea medicilor',
        description: 'Facturat și tratamente: după medicul tratamentului · Programări: după medicul programării',
        columns: [
            { key: 'doctor', label: 'Medic', format: 'text' },
            { key: 'treatments', label: 'Tratamente', format: 'int' },
            { key: 'patients', label: 'Pacienți unici', format: 'int' },
            { key: 'billed', label: 'Facturat', format: 'money' },
            { key: 'collected', label: 'Încasat', format: 'money' },
            { key: 'average', label: 'Medie / tratament', format: 'money' },
            { key: 'appointments', label: 'Programări', format: 'int' },
            { key: 'done', label: 'Finalizate', format: 'int' },
            { key: 'cancelRate', label: '% anulate', format: 'percent' },
            { key: 'noShowRate', label: '% neprezentări', format: 'percent' },
        ],
        rows: rows.map(({ cells }) => ({ cells })),
        totals: {
            doctor: 'Total',
            treatments: totalTreatments,
            patients: num(overall.patients),
            billed: totalBilled,
            collected: sum('collected'),
            average: totalTreatments > 0 ? totalBilled / totalTreatments : null,
            appointments: totalAppointments,
            done: sum('done'),
            cancelRate: totalAppointments > 0 ? percent(totalCancelled, totalAppointments) : null,
            noShowRate: totalAppointments > 0 ? percent(totalNoShow, totalAppointments) : null,
        },
        emptyText: 'Niciun medic adăugat. Medicii se adaugă din Setări → Medici.',
    };

    return {
        kind: 'medici' as const,
        title: 'Medici',
        period: ctx.period,
        kpis: [
            { label: 'Medici activi', value: doctorRows.filter((doctor) => doctor.active).length, format: 'int' as const },
            { label: 'Tratamente', value: totalTreatments, format: 'int' as const, hint: 'efectuate în perioadă' },
            { label: 'Facturat', value: totalBilled, format: 'money' as const },
            { label: 'Încasat', value: sum('collected'), format: 'money' as const },
            { label: 'Programări', value: totalAppointments, format: 'int' as const, hint: 'inclusiv anulate' },
        ],
        tables: [table],
        // În grafic doar medicii cu tratamente în perioadă (tabelul îi arată pe toți)
        chart: rows.filter((row) => row.billed > 0).map((row) => ({ label: row.name, value: row.billed, color: row.color })),
    } satisfies ReportBase & Record<string, unknown>;
}

// ====================================================
// 3. Servicii
// ====================================================

const NO_SERVICE_CATEGORY = 'Fără serviciu ales';

async function getServicesReport(ctx: ReportContext) {
    const { clinicId } = ctx;
    const [performed, unused] = await Promise.all([
        // Tratamentele fără serviciu sunt grupate după descriere, ca în dashboard (Top 5)
        db.execute(sql`
            select coalesce(c.name, ${NO_SERVICE_CATEGORY}) as category,
                coalesce(s.name, t.treatment_description) as service,
                count(*) as count,
                coalesce(sum(t.price), 0) as billed
            from treatments t
            left join services s on s.id = t.service_id
            left join categories c on c.id = s.category_id
            where t.clinic_id = ${clinicId} and ${performedIn(ctx)} ${byDoctor(ctx)}
            group by 1, 2`),

        db.execute(sql`
            select s.name as service, c.name as category, s.price
            from services s
            join categories c on c.id = s.category_id
            where s.clinic_id = ${clinicId} and s.active
                and not exists (
                    select 1 from treatments t
                    where t.service_id = s.id and ${performedIn(ctx)} ${byDoctor(ctx)})
            order by c.name, s.name`),
    ]);

    const services = performed.map((row) => ({
        category: String(row.category),
        service: String(row.service),
        count: num(row.count),
        billed: num(row.billed),
    }));
    const totalBilled = services.reduce((sum, row) => sum + row.billed, 0);
    const totalCount = services.reduce((sum, row) => sum + row.count, 0);

    // Categoriile după facturat; „Fără serviciu ales” la final. În fiecare: subtotal, apoi serviciile.
    const categories = [...new Set(services.map((row) => row.category))]
        .map((category) => {
            const items = services.filter((row) => row.category === category).sort((a, b) => b.billed - a.billed || b.count - a.count);
            return { category, items, billed: items.reduce((sum, row) => sum + row.billed, 0), count: items.reduce((sum, row) => sum + row.count, 0) };
        })
        .sort((a, b) => Number(a.category === NO_SERVICE_CATEGORY) - Number(b.category === NO_SERVICE_CATEGORY) || b.billed - a.billed);

    const servicesTable: ReportTable = {
        id: 'servicii',
        title: 'Servicii realizate, pe categorii',
        description: 'Tratamente efectuate în perioadă · prețul mediu e cel realizat efectiv (poate diferi de lista de prețuri)',
        columns: [
            { key: 'service', label: 'Serviciu', format: 'text' },
            { key: 'category', label: 'Categorie', format: 'text' },
            { key: 'count', label: 'De câte ori', format: 'int' },
            { key: 'billed', label: 'Facturat', format: 'money' },
            { key: 'average', label: 'Preț mediu', format: 'money' },
            { key: 'share', label: '% din facturat', format: 'percent' },
        ],
        rows: categories.flatMap(({ category, items, billed, count }) => [
            {
                subtotal: true,
                cells: { service: category, category, count, billed, average: count > 0 ? billed / count : null, share: percent(billed, totalBilled) },
            },
            ...items.map((row) => ({
                cells: { ...row, average: row.count > 0 ? row.billed / row.count : null, share: percent(row.billed, totalBilled) },
            })),
        ]),
        totals: {
            service: 'Total', count: totalCount, billed: totalBilled,
            average: totalCount > 0 ? totalBilled / totalCount : null, share: totalBilled > 0 ? 100 : 0,
        },
        emptyText: 'Niciun tratament efectuat în această perioadă.',
    };

    const unusedTable: ReportTable = {
        id: 'fara-cerere',
        title: 'Servicii fără cerere în perioadă',
        description: 'Servicii active din lista de prețuri care nu s-au efectuat deloc',
        columns: [
            { key: 'service', label: 'Serviciu', format: 'text' },
            { key: 'category', label: 'Categorie', format: 'text' },
            { key: 'price', label: 'Preț în listă', format: 'money' },
        ],
        rows: unused.map((row) => ({ cells: { service: String(row.service), category: String(row.category), price: num(row.price) } })),
        emptyText: 'Toate serviciile active au fost efectuate cel puțin o dată.',
    };

    return {
        kind: 'servicii' as const,
        title: 'Servicii',
        period: ctx.period,
        kpis: [
            { label: 'Tratamente', value: totalCount, format: 'int' as const, hint: 'efectuate în perioadă' },
            { label: 'Facturat', value: totalBilled, format: 'money' as const },
            { label: 'Preț mediu', value: totalCount > 0 ? totalBilled / totalCount : 0, format: 'money' as const, hint: 'pe tratament' },
            { label: 'Servicii diferite', value: services.length, format: 'int' as const, hint: 'efectuate cel puțin o dată' },
            { label: 'Fără cerere', value: unused.length, format: 'int' as const, hint: 'servicii active neefectuate' },
        ],
        tables: [servicesTable, unusedTable],
        // Top 10 după facturat, pentru grafic
        chart: [...services].sort((a, b) => b.billed - a.billed).slice(0, 10).map((row) => ({ label: row.service, value: row.billed, color: null })),
    } satisfies ReportBase & Record<string, unknown>;
}

// ====================================================
// 4. Programări + Pacienți
// ====================================================

const STATUS_COLUMNS = [
    { key: 'programat', label: 'Programat' },
    { key: 'confirmat', label: 'Confirmat' },
    { key: 'finalizat', label: 'Finalizat' },
    { key: 'anulat', label: 'Anulat' },
    { key: 'neprezentat', label: 'Neprezentat' },
] as const;
const RECALL_MONTHS = 6;

async function getAppointmentsReport(ctx: ReportContext) {
    const { clinicId, period, today } = ctx;
    const inPeriod = sql`${localDate('a.starts_at')} between ${period.from}::date and ${period.to}::date`;
    const step = period.granularity === 'day' ? sql`interval '1 day'` : sql`interval '1 month'`;
    const start = period.granularity === 'day' ? sql`${period.from}::date` : sql`date_trunc('month', ${period.from}::date)::date`;
    const createdOn = localDateUtc('p.created_at');
    const createdBucket = period.granularity === 'day' ? createdOn : sql`date_trunc('month', ${createdOn})::date`;

    const [byStatus, occupancy, [settings], newPatients, categories, recall] = await Promise.all([
        // Pe medic și status (medicul programării)
        db.execute(sql`
            select coalesce('Dr. ' || trim(d.last_name) || ' ' || trim(d.first_name), 'Fără medic') as doctor, a.status, count(*) as count
            from appointments a
            left join doctors d on d.id = a.doctor_id
            where a.clinic_id = ${clinicId} and ${inPeriod} ${byDoctor(ctx, 'a.doctor_id')}
            group by 1, 2`),

        // Harta de ocupare: ziua săptămânii (1 = luni) × ora de început, fără programările anulate
        db.execute(sql`
            select extract(isodow from a.starts_at at time zone ${TZ}) as weekday,
                extract(hour from a.starts_at at time zone ${TZ}) as hour,
                count(*) as count
            from appointments a
            where a.clinic_id = ${clinicId} and ${inPeriod} and a.status <> 'anulat' ${byDoctor(ctx, 'a.doctor_id')}
            group by 1, 2`),

        db.execute(sql`select day_start::text, day_end::text from clinic_settings where clinic_id = ${clinicId}`),

        // Pacienți noi pe zile/luni; generate_series ca axa să fie continuă
        db.execute(sql`
            select to_char(d.day, 'YYYY-MM-DD') as date,
                (select count(*) from patients p
                    where p.clinic_id = ${clinicId} and ${createdBucket} = d.day::date
                        and ${createdOn} between ${period.from}::date and ${period.to}::date) as count
            from generate_series(${start}, ${period.to}::date, ${step}) as d(day)
            order by d.day`),

        db.execute(sql`
            select p.category,
                count(*) filter (where p.status = 'activ') as active,
                count(*) filter (where ${createdOn} between ${period.from}::date and ${period.to}::date) as new
            from patients p
            where p.clinic_id = ${clinicId}
            group by 1`),

        // De rechemat: pacienți activi a căror ultimă vizită (tratament sau programare finalizată)
        // e mai veche de 6 luni și care nu au nicio programare viitoare
        db.execute(sql`
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
                and v.last_visit < ${today}::date - interval '${sql.raw(String(RECALL_MONTHS))} months'
                and not exists (
                    select 1 from appointments a
                    where a.patient_id = p.id and a.starts_at > now() and a.status in ('programat', 'confirmat'))
            order by v.last_visit`),
    ]);

    // --- Programări pe medic × status ---
    const doctors = [...new Set(byStatus.map((row) => String(row.doctor)))].sort((a, b) => a.localeCompare(b, 'ro'));
    const countOf = (doctor: string | null, status: string) => byStatus
        .filter((row) => (doctor === null || row.doctor === doctor) && row.status === status)
        .reduce((sum, row) => sum + num(row.count), 0);
    const statusCells = (doctor: string | null) => {
        const cells: Record<string, number | string> = {};
        for (const { key } of STATUS_COLUMNS) cells[key] = countOf(doctor, key);
        cells.total = STATUS_COLUMNS.reduce((sum, { key }) => sum + Number(cells[key]), 0);
        return cells;
    };
    const totals = statusCells(null);
    const total = Number(totals.total);

    const statusTable: ReportTable = {
        id: 'programari-status',
        title: 'Programări pe medic și status',
        columns: [
            { key: 'doctor', label: 'Medic', format: 'text' },
            ...STATUS_COLUMNS.map(({ key, label }) => ({ key, label, format: 'int' as const })),
            { key: 'total', label: 'Total', format: 'int' },
        ],
        rows: doctors.map((doctor) => ({ cells: { doctor, ...statusCells(doctor) } })),
        totals: { doctor: 'Total', ...totals },
        emptyText: 'Nicio programare în această perioadă.',
    };

    // --- Harta de ocupare: orele din programul clinicii, lărgite dacă există programări în afara lui ---
    const dataHours = occupancy.map((row) => num(row.hour));
    const firstHour = Math.min(Number(String(settings?.day_start ?? '08').slice(0, 2)), ...dataHours);
    const lastHour = Math.max(Number(String(settings?.day_end ?? '20').slice(0, 2)) - 1, ...dataHours);
    const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, index) => firstHour + index);
    const grid = hours.map((hour) => WEEKDAYS_SHORT.map((_, day) =>
        num(occupancy.find((row) => num(row.hour) === hour && num(row.weekday) === day + 1)?.count)));

    const occupancyTable: ReportTable = {
        id: 'ocupare',
        title: 'Ocupare pe zile și ore',
        description: 'Numărul de programări (fără cele anulate) după ziua săptămânii și ora de început',
        columns: [
            { key: 'hour', label: 'Ora', format: 'text' },
            ...WEEKDAYS_SHORT.map((day, index) => ({ key: `d${index + 1}`, label: day, format: 'int' as const })),
        ],
        rows: occupancy.length === 0 ? [] : hours.map((hour, rowIndex) => ({
            cells: {
                hour: `${String(hour).padStart(2, '0')}:00`,
                ...Object.fromEntries(grid[rowIndex].map((count, day) => [`d${day + 1}`, count])),
            },
        })),
        emptyText: 'Nicio programare în această perioadă.',
    };

    // --- Pacienți ---
    const categoryLabel = { adult: 'Adulți', copil: 'Copii' } as Record<string, string>;
    const newTotal = categories.reduce((sum, row) => sum + num(row.new), 0);
    const categoriesTable: ReportTable = {
        id: 'pacienti-categorii',
        title: 'Pacienți pe categorii',
        description: 'Activi = la zi · Noi = înregistrați în perioadă (toți medicii)',
        columns: [
            { key: 'category', label: 'Categorie', format: 'text' },
            { key: 'active', label: 'Pacienți activi', format: 'int' },
            { key: 'new', label: 'Noi în perioadă', format: 'int' },
        ],
        rows: categories.map((row) => ({
            cells: { category: categoryLabel[String(row.category)] ?? String(row.category), active: num(row.active), new: num(row.new) },
        })),
        totals: { category: 'Total', active: categories.reduce((sum, row) => sum + num(row.active), 0), new: newTotal },
        emptyText: 'Niciun pacient înregistrat.',
    };

    const recallTable: ReportTable = {
        id: 'de-rechemat',
        title: `De rechemat (fără vizită de peste ${RECALL_MONTHS} luni)`,
        description: 'Pacienți activi, fără nicio programare viitoare · la zi, toți medicii',
        columns: [
            { key: 'patient', label: 'Pacient', format: 'text' },
            { key: 'recordNumber', label: 'Nr. fișă', format: 'int' },
            { key: 'phone', label: 'Telefon', format: 'text' },
            { key: 'lastVisit', label: 'Ultima vizită', format: 'date' },
            { key: 'months', label: 'Luni de la vizită', format: 'int' },
        ],
        rows: recall.map((row) => ({
            href: `/pacienti/${row.id}`,
            cells: {
                patient: String(row.name),
                recordNumber: row.record_number === null ? null : num(row.record_number),
                phone: row.phone ? String(row.phone) : null,
                lastVisit: String(row.last_visit),
                months: num(row.months),
            },
        })),
        emptyText: `Niciun pacient de rechemat: toți au fost în ultimele ${RECALL_MONTHS} luni sau au deja o programare.`,
    };

    return {
        kind: 'programari' as const,
        title: 'Programări și pacienți',
        period,
        kpis: [
            { label: 'Programări', value: total, format: 'int' as const, hint: 'în perioadă, inclusiv anulate' },
            { label: 'Finalizate', value: Number(totals.finalizat), format: 'int' as const },
            { label: '% anulate', value: percent(Number(totals.anulat), total), format: 'percent' as const },
            { label: '% neprezentări', value: percent(Number(totals.neprezentat), total), format: 'percent' as const, hint: 'pacientul nu a venit' },
            { label: 'Pacienți noi', value: newTotal, format: 'int' as const, hint: 'înregistrați în perioadă' },
        ],
        tables: [statusTable, occupancyTable, categoriesTable, recallTable],
        occupancy: { hours, grid },
        newPatients: newPatients.map((row) => ({ date: String(row.date), count: num(row.count) })),
    } satisfies ReportBase & Record<string, unknown>;
}

// ====================================================
// Punctul de intrare
// ====================================================

export async function getReportForClinic(
    clinicId: string,
    params: { kind: ReportKind; periodKey?: string; doctorId?: string },
    today = todayInClinic(),
) {
    const [clinic] = await db.execute(sql`
        select to_char(${localDateUtc('created_at')}, 'YYYY-MM-DD') as created_on from clinics where id = ${clinicId}`);
    const clinicCreatedOn = String(clinic.created_on);
    const ctx: ReportContext = { clinicId, period: resolvePeriod(params.periodKey, clinicCreatedOn, today), today, doctorId: params.doctorId };
    const months = getAvailableMonths(clinicCreatedOn, today);

    switch (params.kind) {
        case 'medici':
            return { months, report: await getDoctorsReport(ctx) };
        case 'servicii':
            return { months, report: await getServicesReport(ctx) };
        case 'programari':
            return { months, report: await getAppointmentsReport(ctx) };
        default:
            return { months, report: await getFinancialReport(ctx) };
    }
}

export type Report = Awaited<ReturnType<typeof getReportForClinic>>['report'];
