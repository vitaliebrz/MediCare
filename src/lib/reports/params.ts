import { DEFAULT_PERIOD } from '@/lib/dashboard-period';
import { REPORT_KINDS, type ReportKind } from './types';

export const REPORT_META: Record<ReportKind, { label: string; doctorFilter: boolean }> = {
    financiar: { label: 'Financiar', doctorFilter: true },
    medici: { label: 'Medici', doctorFilter: false }, // îi arată oricum pe toți medicii
    servicii: { label: 'Servicii', doctorFilter: true },
    programari: { label: 'Programări și pacienți', doctorFilter: true },
};

export interface ReportParams {
    kind: ReportKind;
    periodKey: string;
    doctorId?: string;
}

// Parametrii din URL pot fi orice; un raport necunoscut devine „financiar”.
// Perioada e verificată de resolvePeriod, iar medicul de getReport (trebuie să fie al clinicii).
export const parseReportKind = (value: string | undefined): ReportKind =>
    REPORT_KINDS.includes(value as ReportKind) ? (value as ReportKind) : 'financiar';

// URL-ul unei vizualizări / al unui export; valorile implicite nu apar în URL
export function reportQuery({ kind, periodKey, doctorId }: ReportParams, extra: Record<string, string> = {}) {
    const params = new URLSearchParams();
    if (kind !== 'financiar') params.set('raport', kind);
    if (periodKey !== DEFAULT_PERIOD) params.set('perioada', periodKey);
    if (doctorId && REPORT_META[kind].doctorFilter) params.set('medic', doctorId);
    for (const [key, value] of Object.entries(extra)) params.set(key, value);
    const query = params.toString();
    return query ? `?${query}` : '';
}
