import { formatDate, formatMoney } from '@/lib/format';
import type { CellFormat, CellValue } from './types';

const oneDecimal = (value: number) => (Math.round(value * 10) / 10).toString().replace('.', ',');

// Valoarea afișată în pagină și în PDF
export function formatCell(value: CellValue, format: CellFormat, currency: string): string {
    if (value === null || value === '') return '—';
    switch (format) {
        case 'money': return formatMoney(value, currency);
        case 'int': return String(Math.round(Number(value)));
        case 'percent': return `${oneDecimal(Number(value))}%`;
        case 'date': return formatDate(String(value));
        default: return String(value);
    }
}

// Numerele se aliniază la dreapta, ca să se compare ușor pe coloană
export const isNumeric = (format: CellFormat) => format === 'money' || format === 'int' || format === 'percent';
