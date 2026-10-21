// Perioada aleasă în dashboard (?perioada=) și perioada cu care se compară.
// Toate datele sunt șiruri 'YYYY-MM-DD' în ora Chișinăului, ca rezultatul să nu depindă
// de fusul orar al serverului (Vercel rulează în UTC). Vezi docs/plans/dashboard.md.

export const CLINIC_TIME_ZONE = 'Europe/Chisinau';

const MONTHS = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
export const MONTHS_LOWER = MONTHS.map((month) => month.toLowerCase());

export interface DateRange {
    from: string;
    to: string;
}

export interface DashboardPeriod extends DateRange {
    key: string;
    label: string;
    granularity: 'day' | 'month';
    previous: DateRange | null; // null = fără comparație ("De la început")
    comparisonLabel: string | null; // ex. "vs. 30 de zile anterioare"
}

export const DEFAULT_PERIOD = '30z';

export function todayInClinic(now = new Date()): string {
    return now.toLocaleDateString('sv-SE', { timeZone: CLINIC_TIME_ZONE });
}

// Aritmetică pe date 'YYYY-MM-DD' (în UTC, ca să nu intervină ora de vară)
export function addDays(date: string, days: number): string {
    const value = new Date(`${date}T00:00:00Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
}

const lastDayOfMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate(); // month: 1-12
const pad = (value: number) => String(value).padStart(2, '0');
const monthKey = (year: number, month: number) => `${year}-${pad(month)}`;

export function monthLabel(key: string): string {
    const [year, month] = key.split('-').map(Number);
    return `${MONTHS[month - 1]} ${year}`;
}

// Lunile pentru selector, de la luna curentă înapoi până la luna creării clinicii
export function getAvailableMonths(clinicCreatedOn: string, today = todayInClinic()): { key: string; label: string }[] {
    const [startYear, startMonth] = clinicCreatedOn.split('-').map(Number);
    let [year, month] = today.split('-').map(Number);
    const months = [];
    while (year > startYear || (year === startYear && month >= startMonth)) {
        const key = monthKey(year, month);
        months.push({ key, label: monthLabel(key) });
        month--;
        if (month === 0) { month = 12; year--; }
    }
    return months;
}

export function resolvePeriod(rawKey: string | undefined, clinicCreatedOn: string, today = todayInClinic()): DashboardPeriod {
    const key = rawKey ?? DEFAULT_PERIOD;

    if (key === '7z' || key === '30z') {
        const days = key === '7z' ? 7 : 30;
        const from = addDays(today, -(days - 1)); // azi inclusiv
        return {
            key, from, to: today, granularity: 'day',
            label: `Ultimele ${days} de zile`.replace('7 de', '7'),
            previous: { from: addDays(from, -days), to: addDays(from, -1) },
            comparisonLabel: `vs. ${days === 7 ? '7' : '30 de'} zile anterioare`,
        };
    }

    if (key === 'tot') {
        return {
            key, from: clinicCreatedOn, to: today, granularity: 'month',
            label: 'De la început', previous: null, comparisonLabel: null,
        };
    }

    // O lună anume: 'YYYY-MM', între luna creării clinicii și luna curentă
    const isAvailableMonth = /^\d{4}-\d{2}$/.test(key) && getAvailableMonths(clinicCreatedOn, today).some((month) => month.key === key);
    if (isAvailableMonth) {
        const [year, month] = key.split('-').map(Number);
        const previousYear = month === 1 ? year - 1 : year;
        const previousMonth = month === 1 ? 12 : month - 1;
        const isCurrentMonth = today.startsWith(key);
        const from = `${key}-01`;
        const to = isCurrentMonth ? today : `${key}-${pad(lastDayOfMonth(year, month))}`;
        // Luna curentă se compară cu ACELEAȘI zile din luna trecută (month-to-date), altfel cu luna întreagă
        const previousLastDay = lastDayOfMonth(previousYear, previousMonth);
        const previousEndDay = isCurrentMonth ? Math.min(Number(today.slice(8, 10)), previousLastDay) : previousLastDay;
        return {
            key, from, to, granularity: 'day',
            label: monthLabel(key),
            previous: {
                from: `${monthKey(previousYear, previousMonth)}-01`,
                to: `${monthKey(previousYear, previousMonth)}-${pad(previousEndDay)}`,
            },
            comparisonLabel: isCurrentMonth
                ? `vs. 1–${previousEndDay} ${MONTHS_LOWER[previousMonth - 1]}`
                : `vs. ${MONTHS_LOWER[previousMonth - 1]}`,
        };
    }

    // Valoare invalidă în URL -> perioada implicită
    return resolvePeriod(DEFAULT_PERIOD, clinicCreatedOn, today);
}
