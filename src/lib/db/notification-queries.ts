// Alertele din clopoțel și de pe pagina Setări → Notificări.
// Nu sunt salvate nicăieri: se calculează din date la fiecare cerere, deci o alertă dispare singură
// când cauza ei e rezolvată (programarea e confirmată, datoria e achitată...).
// Fișierul NU are 'use server': se apelează doar din src/lib/actions/notifications.ts, care ia clinicId din sesiune.
// Ca în report-queries.ts, SQL-ul folosește aliasuri explicite (p.id, t.patient_id), nu ${tabel.coloana}.

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { addDays } from '@/lib/dashboard-period';
import { formatDate, formatMoney } from '@/lib/format';
import { getRecallPatients, localDate, num, TZ, UNPAID } from '@/lib/db/sql-helpers';
import type { NotificationSettingsFormData } from '@/lib/validations/notifications';

export type NotificationKind = 'unconfirmed' | 'pending' | 'debts' | 'incomplete' | 'recall' | 'birthdays';

export interface NotificationItem {
    label: string; // numele pacientului
    detail: string; // ex. „mâine, 10:30” sau „1 250.00 MDL”
    href: string;
}

export interface AppNotification {
    kind: NotificationKind;
    tone: 'warning' | 'info'; // warning = ceva de rezolvat; info = bine de știut
    title: string;
    count: number;
    items: NotificationItem[]; // primele PREVIEW cazuri
    href: string; // „Vezi toate”
}

const PREVIEW = 5;

// Programările de azi / mâine, la ora clinicii: 'YYYY-MM-DD' și 'HH:MM'
const startsDay = sql`to_char(a.starts_at at time zone ${TZ}, 'YYYY-MM-DD')`;
const startsTime = sql`to_char(a.starts_at at time zone ${TZ}, 'HH24:MI')`;
const dayHref = (date: string) => `/programari?vedere=zi&data=${date}`;

// „1 pacient”, „5 pacienți”, „20 de pacienți”: în română, de la 20 în sus (și la 100, 200...) se pune „de”
const plural = (count: number, one: string, many: string) => {
    if (count === 1) return `1 ${one}`;
    const rest = count % 100;
    return rest === 0 || rest >= 20 ? `${count} de ${many}` : `${count} ${many}`;
};

export async function getNotificationsForUser(
    clinicId: string,
    settings: NotificationSettingsFormData,
    today: string,
    currency: string,
): Promise<AppNotification[]> {
    const tomorrow = addDays(today, 1);
    const none = Promise.resolve([] as Record<string, unknown>[]);
    const dayLabel = (date: string) => (date === today ? 'azi' : date === tomorrow ? 'mâine' : formatDate(date));

    // Doar alertele active pornesc, toate în paralel. count(*) over () = totalul, chiar dacă aducem doar PREVIEW rânduri.
    const [unconfirmed, pending, debts, incomplete, recall, birthdays] = await Promise.all([
        // 1. Programări viitoare de azi și mâine, încă neconfirmate
        settings.unconfirmedAppointments ? db.execute(sql`
            select p.last_name || ' ' || p.first_name as name, ${startsDay} as day, ${startsTime} as time, count(*) over () as total
            from appointments a join patients p on p.id = a.patient_id
            where a.clinic_id = ${clinicId} and a.status = 'programat' and a.starts_at >= now()
                and ${localDate('a.starts_at')} between ${today}::date and ${tomorrow}::date
            order by a.starts_at limit ${PREVIEW}`) : none,

        // 2. Programări a căror oră de sfârșit a trecut, dar fără status final (Finalizat / Anulat / Neprezentat)
        settings.pendingAppointments ? db.execute(sql`
            select p.last_name || ' ' || p.first_name as name, ${startsDay} as day, ${startsTime} as time, count(*) over () as total
            from appointments a join patients p on p.id = a.patient_id
            where a.clinic_id = ${clinicId} and a.status in ('programat', 'confirmat')
                and a.starts_at + make_interval(mins => a.duration_minutes) < now()
            order by a.starts_at desc limit ${PREVIEW}`) : none,

        // 3. Pacienți cu tratamente neachitate mai vechi de N zile (suma doar a celor vechi)
        settings.oldDebts ? db.execute(sql`
            select p.id, p.last_name || ' ' || p.first_name as name, sum(t.price) as amount, count(*) over () as total
            from treatments t join patients p on p.id = t.patient_id
            where t.clinic_id = ${clinicId} and ${UNPAID}
                and t.performed_at <= ${today}::date - ${settings.debtDays}::int
            group by p.id
            order by amount desc limit ${PREVIEW}`) : none,

        // 4. Pacienți activi fără IDNP (creați rapid dintr-o programare)
        settings.incompleteData ? db.execute(sql`
            select p.id, p.last_name || ' ' || p.first_name as name, p.phone, count(*) over () as total
            from patients p
            where p.clinic_id = ${clinicId} and p.status = 'activ' and p.idnp is null
            order by p.created_at desc limit ${PREVIEW}`) : none,

        // 5. De rechemat: aceeași interogare ca în raportul Programări, cu pragul utilizatorului
        settings.recall ? getRecallPatients(clinicId, today, settings.recallMonths) : none,

        // 6. Zile de naștere azi (pacienți activi). to_char compară luna și ziua, fără anul nașterii.
        settings.birthdays ? db.execute(sql`
            select p.id, p.last_name || ' ' || p.first_name as name,
                extract(year from age(${today}::date, p.birth_date)) as age, count(*) over () as total
            from patients p
            where p.clinic_id = ${clinicId} and p.status = 'activ'
                and to_char(p.birth_date, 'MM-DD') = to_char(${today}::date, 'MM-DD')
            order by p.last_name limit ${PREVIEW}`) : none,
    ]);

    const total = (rows: Record<string, unknown>[]) => (rows.length > 0 ? num(rows[0].total) : 0);
    const notifications: AppNotification[] = [];

    if (unconfirmed.length > 0) {
        const count = total(unconfirmed);
        notifications.push({
            kind: 'unconfirmed',
            tone: 'info',
            title: `${plural(count, 'programare neconfirmată', 'programări neconfirmate')} azi și mâine`,
            count,
            items: unconfirmed.map((row) => ({
                label: String(row.name),
                detail: `${dayLabel(String(row.day))}, ${row.time}`,
                href: dayHref(String(row.day)),
            })),
            href: dayHref(String(unconfirmed[0].day)),
        });
    }

    if (pending.length > 0) {
        const count = total(pending);
        notifications.push({
            kind: 'pending',
            tone: 'warning',
            title: `${plural(count, 'programare trecută', 'programări trecute')} fără status final`,
            count,
            items: pending.map((row) => ({
                label: String(row.name),
                detail: `${dayLabel(String(row.day))}, ${row.time}`,
                href: dayHref(String(row.day)),
            })),
            href: dayHref(String(pending[0].day)),
        });
    }

    if (debts.length > 0) {
        const count = total(debts);
        notifications.push({
            kind: 'debts',
            tone: 'warning',
            title: `${plural(count, 'pacient', 'pacienți')} cu datorii mai vechi de ${plural(settings.debtDays, 'zi', 'zile')}`,
            count,
            items: debts.map((row) => ({
                label: String(row.name),
                detail: formatMoney(num(row.amount), currency),
                href: `/pacienti/${row.id}`,
            })),
            href: '/rapoarte?raport=financiar',
        });
    }

    if (incomplete.length > 0) {
        const count = total(incomplete);
        notifications.push({
            kind: 'incomplete',
            tone: 'warning',
            title: `${plural(count, 'pacient', 'pacienți')} cu date incomplete`,
            count,
            items: incomplete.map((row) => ({
                label: String(row.name),
                detail: 'fără IDNP',
                href: `/pacienti/${row.id}`,
            })),
            href: '/pacienti',
        });
    }

    if (recall.length > 0) {
        const count = recall.length; // getRecallPatients aduce toate rândurile (le folosește și raportul)
        notifications.push({
            kind: 'recall',
            tone: 'info',
            title: `${plural(count, 'pacient', 'pacienți')} de rechemat (fără vizită de peste ${plural(settings.recallMonths, 'lună', 'luni')})`,
            count,
            items: recall.slice(0, PREVIEW).map((row) => ({
                label: String(row.name),
                detail: `ultima vizită ${formatDate(String(row.last_visit))}`,
                href: `/pacienti/${row.id}`,
            })),
            href: '/rapoarte?raport=programari',
        });
    }

    if (birthdays.length > 0) {
        const count = total(birthdays);
        notifications.push({
            kind: 'birthdays',
            tone: 'info',
            title: `${plural(count, 'pacient își serbează', 'pacienți își serbează')} ziua de naștere azi`,
            count,
            items: birthdays.map((row) => ({
                label: String(row.name),
                detail: `împlinește ${plural(num(row.age), 'an', 'ani')}`,
                href: `/pacienti/${row.id}`,
            })),
            href: birthdays.length === 1 ? `/pacienti/${birthdays[0].id}` : '/pacienti',
        });
    }

    return notifications;
}
