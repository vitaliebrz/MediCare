// Descrierea comună a unui raport. Din aceleași obiecte se construiesc tabelul din pagină,
// CSV-ul și PDF-ul, ca cele trei să nu poată ajunge să arate cifre diferite.
// Vezi docs/plans/rapoarte.md.

import type { DashboardPeriod } from '@/lib/dashboard-period';

export const REPORT_KINDS = ['financiar', 'medici', 'servicii', 'programari'] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

// Cum se afișează o valoare: 'percent' e un număr 0–100 (ex. 37.5 -> „37,5%”)
export type CellFormat = 'text' | 'int' | 'money' | 'percent' | 'date';
export type CellValue = string | number | null;

export interface ReportColumn {
    key: string;
    label: string;
    format: CellFormat;
}

export interface ReportRow {
    cells: Record<string, CellValue>;
    href?: string; // ex. fișa pacientului; se pune pe prima coloană
    // rând de subtotal (ex. o categorie de servicii): îngroșat în pagină și PDF
    subtotal?: boolean;
}

export interface ReportTable {
    id: string; // folosit în URL-ul CSV-ului (?tabel=debitori) și în numele fișierului
    title: string;
    description?: string;
    columns: ReportColumn[];
    rows: ReportRow[];
    totals?: Record<string, CellValue>; // linia Total; cheile lipsă rămân goale
    emptyText: string;
}

export interface ReportKpi {
    label: string;
    value: number;
    format: CellFormat;
    hint?: string;
}

// Datele comune tuturor rapoartelor (tot ce intră în CSV și PDF).
// Fiecare raport adaugă propriile date pentru grafice.
export interface ReportBase {
    title: string;
    period: DashboardPeriod;
    kpis: ReportKpi[];
    tables: ReportTable[];
}
