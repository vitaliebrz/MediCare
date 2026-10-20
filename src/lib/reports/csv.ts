import { formatDate } from '@/lib/format';
import type { CellFormat, CellValue, ReportTable } from './types';

// CSV pentru Excel cu setări regionale românești:
// - BOM la început: altfel Excel citește diacriticele greșit;
// - separator „;” și zecimale cu virgulă: așa le recunoaște Excel ca numere (virgula e deja separatorul zecimal);
// - fără simbolul monedei în celule, ca sumele să rămână numere; moneda e în antetul coloanei.
const BOM = '﻿';
const SEPARATOR = ';';

function csvValue(value: CellValue, format: CellFormat): string {
    if (value === null || value === '') return '';
    if (format === 'money' || format === 'percent') return Number(value).toFixed(format === 'money' ? 2 : 1).replace('.', ',');
    if (format === 'int') return String(Math.round(Number(value)));
    if (format === 'date') return formatDate(String(value));
    const text = String(value);
    // Telefon / IDNP: Excel ar șterge zeroul din față (069... -> 69...) sau ar scrie 2,00E+12.
    // Ca formulă text (="069...") valoarea rămâne exact cum e.
    if (/^\+?\d{6,}$/.test(text)) return `="${text}"`;
    return text;
}

// Ghilimele doar când e nevoie (separator, ghilimele sau rând nou în text)
const quote = (text: string) => (/[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);

export function tableToCsv(table: ReportTable, currency: string): string {
    const header = table.columns.map((column) => quote(column.format === 'money' ? `${column.label} (${currency})` : column.label));
    const lines = [header.join(SEPARATOR)];
    for (const row of table.rows) {
        lines.push(table.columns.map((column) => quote(csvValue(row.cells[column.key] ?? null, column.format))).join(SEPARATOR));
    }
    if (table.totals) {
        lines.push(table.columns.map((column) => quote(csvValue(table.totals?.[column.key] ?? null, column.format))).join(SEPARATOR));
    }
    // Windows: Excel așteaptă \r\n între rânduri
    return BOM + lines.join('\r\n') + '\r\n';
}
