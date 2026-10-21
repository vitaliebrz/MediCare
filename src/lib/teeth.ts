import type { ToothStatusValue } from '@/lib/db/schema';

// ====================================================
// Numerotarea FDI: prima cifră = cadranul, a doua = poziția de la mijloc spre spate.
// Cadrane: 1 sus-dreapta, 2 sus-stânga, 3 jos-stânga, 4 jos-dreapta (5-8 la fel, pentru dinții de lapte).
// "Dreapta/stânga" sunt ale PACIENTULUI - de aceea pe ecran cadranul 1 e în stânga (medicul stă în fața lui).
// ====================================================

const range = (from: number, to: number) => {
    const step = from <= to ? 1 : -1;
    return Array.from({ length: Math.abs(to - from) + 1 }, (_, i) => from + i * step);
};

export type Dentition = 'adult' | 'copil';

// Rândurile schemei, în ordinea în care le vede medicul
export const DENTAL_CHART: Record<Dentition, { upper: number[][]; lower: number[][] }> = {
    adult: {
        upper: [range(18, 11), range(21, 28)],
        lower: [range(48, 41), range(31, 38)],
    },
    copil: {
        upper: [range(55, 51), range(61, 65)],
        lower: [range(85, 81), range(71, 75)],
    },
};

export const ALL_TEETH: number[] = Object.values(DENTAL_CHART).flatMap((chart) =>
    [...chart.upper, ...chart.lower].flat()
);

export const isValidTooth = (tooth: number) => ALL_TEETH.includes(tooth);

const ADULT_POSITIONS = ['Incisiv central', 'Incisiv lateral', 'Canin', 'Premolar 1', 'Premolar 2', 'Molar 1', 'Molar 2', 'Molar 3 (de minte)'];
const CHILD_POSITIONS = ['Incisiv central', 'Incisiv lateral', 'Canin', 'Molar 1', 'Molar 2'];

// 16 -> "Molar 1 superior dreapta", 75 -> "Molar 2 de lapte inferior stânga"
export function toothName(tooth: number): string {
    const quadrant = Math.floor(tooth / 10);
    const position = tooth % 10;
    const isChild = quadrant >= 5;
    const base = isChild ? quadrant - 4 : quadrant;
    const name = (isChild ? CHILD_POSITIONS : ADULT_POSITIONS)[position - 1];
    const jaw = base <= 2 ? 'superior' : 'inferior';
    const side = base === 1 || base === 4 ? 'dreapta' : 'stânga';
    return `${name}${isChild ? ' de lapte' : ''} ${jaw} ${side}`;
}

// Eticheta și culorile fiecărei stări - folosite în schemă, legendă și panou
export const TOOTH_STATUS: Record<ToothStatusValue, { label: string; fill: string; stroke: string; badge: string }> = {
    sanatos: { label: 'Sănătos', fill: '#ffffff', stroke: '#a1a1aa', badge: 'bg-zinc-100 text-zinc-600' },
    tratat: { label: 'Tratat', fill: '#99f6e4', stroke: '#14b8a6', badge: 'bg-teal-100 text-teal-700' },
    necesita_tratament: { label: 'Necesită tratament', fill: '#fecaca', stroke: '#ef4444', badge: 'bg-red-100 text-red-700' },
    extras: { label: 'Extras', fill: '#e4e4e7', stroke: '#71717a', badge: 'bg-zinc-200 text-zinc-700' },
    cazut_natural: { label: 'Căzut natural', fill: '#f4f4f5', stroke: '#d4d4d8', badge: 'bg-zinc-100 text-zinc-500' },
};

export const TOOTH_STATUS_VALUES = Object.keys(TOOTH_STATUS) as ToothStatusValue[];
