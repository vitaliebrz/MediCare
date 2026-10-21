import { Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { changeTone, type Change } from '@/lib/percent-change';

interface StatCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    change: Change;
    // false pentru Datorii: acolo o scădere e veste bună (verde)
    higherIsBetter: boolean;
    // ex. "vs. 30 de zile anterioare"; null la "De la început"
    comparisonLabel: string | null;
    // text alternativ sub valoare, când nu există comparație (ex. "6 pacienți datorează")
    footnote?: string;
}

const TONE_CLASSES = {
    good: 'bg-green-50 text-green-700',
    bad: 'bg-red-50 text-red-700',
    neutral: 'bg-zinc-100 text-zinc-600',
};

export const StatCard = ({ title, value, icon: Icon, change, higherIsBetter, comparisonLabel, footnote }: StatCardProps) => {
    const tone = changeTone(change, higherIsBetter);

    return (
        <div className='flex flex-col gap-3 rounded-lg border bg-white p-4'>
            <div className='flex items-start justify-between gap-2'>
                <div className='rounded-lg bg-teal-50 p-2 text-teal-600'>
                    <Icon className='h-5 w-5' />
                </div>
                {change.kind !== 'none' && (
                    // Iconița și semnul spun direcția și fără culoare
                    <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums', TONE_CLASSES[tone])}>
                        <ChangeIcon change={change} />
                        {formatChange(change)}
                    </span>
                )}
            </div>
            <div>
                <p className='text-sm text-slate-500'>{title}</p>
                <p className='mt-1 text-2xl font-bold tabular-nums'>{value}</p>
                {(change.kind !== 'none' && comparisonLabel) || footnote ? (
                    <p className='mt-1 text-xs text-slate-500'>
                        {change.kind !== 'none' && comparisonLabel ? comparisonLabel : footnote}
                    </p>
                ) : null}
            </div>
        </div>
    );
};

const ChangeIcon = ({ change }: { change: Change }) => {
    if (change.kind === 'percent' && change.value === 0) return <Minus className='h-3.5 w-3.5' />;
    if (change.kind === 'percent' && change.value < 0) return <TrendingDown className='h-3.5 w-3.5' />;
    return <TrendingUp className='h-3.5 w-3.5' />;
};

function formatChange(change: Change): string {
    if (change.kind === 'new') return 'Nou';
    if (change.kind !== 'percent') return '';
    if (change.value > 0) return `+${change.value}%`;
    if (change.value < 0) return `−${Math.abs(change.value)}%`; // minus tipografic, nu cratimă
    return '0%';
}
