import { cn } from '@/lib/utils';

// Clase comune, ca tabelele, etichetele și butoanele să arate la fel pe toate paginile

// Paginile din meniu: 16px pe telefon, 32px pe ecran mare
export const PAGE_CLASS = 'p-4 md:p-8 flex flex-col gap-4';

// Tabele: fundal alb, derulare orizontală pe telefon, antet gri deschis
export const TABLE_WRAPPER_CLASS = 'overflow-x-auto rounded-md border bg-white';
export const TABLE_HEAD_ROW_CLASS = 'bg-zinc-100 hover:bg-zinc-100';

// Butonul principal (turcoaz)
export const PRIMARY_BUTTON_CLASS = 'bg-teal-500 hover:bg-teal-600 cursor-pointer gap-2';

// Butoanele-iconiță din coloana „Acțiuni”
export const ICON_BUTTON_CLASS = 'bg-transparent text-zinc-500 cursor-pointer hover:bg-teal-500/50 hover:text-white';
export const ICON_DELETE_BUTTON_CLASS = 'bg-transparent text-zinc-500 cursor-pointer hover:bg-red-200 hover:text-red-500';

// Etichete (Activ, Copil, Date incomplete...)
const PILL_TONES = {
    green: 'bg-green-100 text-green-700',
    teal: 'bg-teal-100 text-teal-700',
    amber: 'bg-amber-100 text-amber-700',
    neutral: 'bg-zinc-100 text-zinc-600',
};
export type PillTone = keyof typeof PILL_TONES;
export const pillClass = (tone: PillTone, className?: string) =>
    cn('inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', PILL_TONES[tone], className);
