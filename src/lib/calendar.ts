// Funcții pure pentru calendarul de programări (/programari).
// Datele sunt șiruri 'YYYY-MM-DD' în ora Chișinăului, orele 'HH:MM' — ca în dashboard-period.ts.

import { addDays, MONTHS_LOWER, todayInClinic } from '@/lib/dashboard-period';

export type CalendarViewKind = 'zi' | 'saptamana';

export interface CalendarView {
    view: CalendarViewKind;
    date: string; // ziua aleasă (în vizualizarea Săptămână: orice zi din săptămână)
    days: string[]; // zilele afișate: 1 sau 7, de luni până duminică
    from: string;
    to: string;
    previous: string; // data pentru butonul ‹
    next: string; // data pentru butonul ›
    title: string;
}

const WEEKDAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
export const WEEKDAYS_SHORT = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];

// 0 = luni ... 6 = duminică (getUTCDay dă 0 = duminică)
export function weekdayIndex(date: string): number {
    return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

const isValidDate = (value: string | undefined): value is string =>
    !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())
    && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value); // respinge 2026-02-31

const dayNumber = (date: string) => Number(date.slice(8, 10));
const monthName = (date: string) => MONTHS_LOWER[Number(date.slice(5, 7)) - 1];
const year = (date: string) => date.slice(0, 4);

// Parametrii din URL pot fi orice (îi scrie utilizatorul); valorile invalide devin cele implicite
export function resolveCalendarView(params: { vedere?: string; data?: string }, today = todayInClinic()): CalendarView {
    const view: CalendarViewKind = params.vedere === 'zi' ? 'zi' : 'saptamana';
    const date = isValidDate(params.data) ? params.data : today;

    if (view === 'zi') {
        return {
            view, date, days: [date], from: date, to: date,
            previous: addDays(date, -1), next: addDays(date, 1),
            title: `${WEEKDAYS[weekdayIndex(date)]}, ${dayNumber(date)} ${monthName(date)} ${year(date)}`,
        };
    }

    const monday = addDays(date, -weekdayIndex(date));
    const sunday = addDays(monday, 6);
    const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
    // "13 – 19 octombrie 2026", "27 octombrie – 2 noiembrie 2026", "29 decembrie 2025 – 4 ianuarie 2026"
    const sameMonth = monday.slice(0, 7) === sunday.slice(0, 7);
    const sameYear = year(monday) === year(sunday);
    const start = sameMonth ? `${dayNumber(monday)}` : `${dayNumber(monday)} ${monthName(monday)}${sameYear ? '' : ` ${year(monday)}`}`;
    return {
        view, date, days, from: monday, to: sunday,
        previous: addDays(date, -7), next: addDays(date, 7),
        title: `${start} – ${dayNumber(sunday)} ${monthName(sunday)} ${year(sunday)}`,
    };
}

export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Ora de sfârșit: '09:30' + 45 min -> '10:15'
export const endTime = (time: string, durationMinutes: number) => minutesToTime(timeToMinutes(time) + durationMinutes);

export interface OverlapSlot {
    column: number; // coloana programării în grupul de suprapuneri (0, 1, ...)
    columns: number; // câte coloane are grupul -> lățimea = 1 / columns
}

// Programările care se suprapun în aceeași coloană a calendarului stau una lângă alta.
// 1. sortăm după ora de început;
// 2. formăm "grupuri": programări legate între ele prin suprapuneri;
// 3. în fiecare grup, o programare intră în prima coloană liberă (unde precedenta s-a terminat).
export function layoutOverlaps(events: { id: string; start: number; end: number }[]): Map<string, OverlapSlot> {
    const result = new Map<string, OverlapSlot>();
    const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end);

    let group: { id: string; column: number }[] = [];
    let columnEnds: number[] = []; // pentru fiecare coloană: când se termină ultima programare din ea
    let groupEnd = -1;

    const closeGroup = () => {
        for (const item of group) result.set(item.id, { column: item.column, columns: columnEnds.length });
        group = [];
        columnEnds = [];
    };

    for (const event of sorted) {
        if (event.start >= groupEnd) closeGroup(); // nu se suprapune cu nimic din grup -> grup nou
        let column = columnEnds.findIndex((end) => end <= event.start);
        if (column === -1) {
            column = columnEnds.length;
            columnEnds.push(event.end);
        } else {
            columnEnds[column] = event.end;
        }
        group.push({ id: event.id, column });
        groupEnd = Math.max(groupEnd, event.end);
    }
    closeGroup();
    return result;
}
