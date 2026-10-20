'use client'

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ToothStatusValue } from '@/lib/db/schema';
import type { TreatmentRow } from '@/lib/actions/treatments';
import { DENTAL_CHART, TOOTH_STATUS, TOOTH_STATUS_VALUES, type Dentition } from '@/lib/teeth';
import { ToothPanel } from './tooth-panel';
import type { TreatmentFormOptions } from './treatment-form';

interface DentalChartProps extends TreatmentFormOptions {
    category: 'adult' | 'copil';
    teeth: { toothNumber: number; status: ToothStatusValue }[];
    treatments: TreatmentRow[];
}

export const DentalChart = ({ category, teeth, treatments, ...formOptions }: DentalChartProps) => {
    // Schema urmează categoria din datele personale: copil -> dinți de lapte, adult -> dinți permanenți.
    // Rămâne comutabilă manual (un copil de 10 ani are dentiție mixtă).
    const [dentition, setDentition] = useState<Dentition>(category);
    // Dacă se schimbă categoria (din „Editează”), schema trece pe dentiția nouă. Ajustare în timpul
    // render-ului, fără useEffect: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
    const [prevCategory, setPrevCategory] = useState(category);
    if (category !== prevCategory) {
        setPrevCategory(category);
        setDentition(category);
    }
    // Dintele din panou e păstrat separat de `panelOpen`, ca titlul să nu dispară în animația de închidere
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [panelOpen, setPanelOpen] = useState(false);

    // Map/Set pentru căutare rapidă: dinte -> stare, dinți cu tratamente
    const statusByTooth = new Map(teeth.map((tooth) => [tooth.toothNumber, tooth.status]));
    const treatedTeeth = new Set(treatments.map((treatment) => treatment.toothNumber));
    const statusOf = (tooth: number): ToothStatusValue => statusByTooth.get(tooth) ?? 'sanatos';

    const openTooth = (tooth: number) => {
        setSelectedTooth(tooth);
        setPanelOpen(true);
    };

    const chart = DENTAL_CHART[dentition];

    const renderRow = (halves: number[][], jaw: 'upper' | 'lower') => (
        <div className='flex justify-center'>
            {halves.map((half, index) => (
                <div
                    key={index}
                    // Linia verticală dintre jumătatea dreaptă și cea stângă a pacientului
                    className={cn('flex gap-0.5 sm:gap-1 px-1 sm:px-2', index === 0 && 'border-r-2 border-slate-300')}
                >
                    {half.map((tooth) => (
                        <ToothButton
                            key={tooth}
                            tooth={tooth}
                            jaw={jaw}
                            status={statusOf(tooth)}
                            hasHistory={treatedTeeth.has(tooth)}
                            onClick={() => openTooth(tooth)}
                        />
                    ))}
                </div>
            ))}
        </div>
    );

    return (
        <div className='flex flex-col gap-4 rounded-md border bg-white p-4'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <Tabs value={dentition} onValueChange={(value) => setDentition(value as Dentition)}>
                    <TabsList>
                        <TabsTrigger value='adult'>Adult</TabsTrigger>
                        <TabsTrigger value='copil'>Copil</TabsTrigger>
                    </TabsList>
                </Tabs>
                <p className='text-sm text-slate-500'>Apasă pe un dinte pentru detalii și tratamente</p>
            </div>

            {/* Pe ecrane înguste schema se poate derula orizontal */}
            <div className='overflow-x-auto'>
                <div className='mx-auto flex w-max flex-col gap-2 py-2'>
                    <span className='text-center text-xs uppercase tracking-wide text-slate-400'>Maxilar</span>
                    {renderRow(chart.upper, 'upper')}
                    <div className='border-t-2 border-slate-300' />
                    {renderRow(chart.lower, 'lower')}
                    <span className='text-center text-xs uppercase tracking-wide text-slate-400'>Mandibulă</span>
                </div>
            </div>

            {/* Legenda culorilor */}
            <div className='flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600'>
                {TOOTH_STATUS_VALUES.map((status) => (
                    <span key={status} className='flex items-center gap-1.5'>
                        <span
                            className='h-3 w-3 rounded-sm border'
                            style={{ backgroundColor: TOOTH_STATUS[status].fill, borderColor: TOOTH_STATUS[status].stroke }}
                        />
                        {TOOTH_STATUS[status].label}
                    </span>
                ))}
                <span className='flex items-center gap-1.5'>
                    <span className='h-1.5 w-1.5 rounded-full bg-teal-500' /> Are tratamente
                </span>
            </div>

            <ToothPanel
                {...formOptions}
                open={panelOpen}
                onOpenChange={setPanelOpen}
                tooth={selectedTooth}
                status={selectedTooth === null ? 'sanatos' : statusOf(selectedTooth)}
                treatments={treatments.filter((treatment) => treatment.toothNumber === selectedTooth)}
            />
        </div>
    );
};

// Forma simplă a unui dinte: coroana sus, două rădăcini jos (viewBox 40x48)
const TOOTH_PATH = 'M8 4 C4 4 2 8 2 14 C2 22 6 26 8 34 C9 40 10 46 13 46 C16 46 16 38 20 34 C24 38 24 46 27 46 C30 46 31 40 32 34 C34 26 38 22 38 14 C38 8 36 4 32 4 C28 4 26 6 20 6 C14 6 12 4 8 4 Z';

const ToothButton = ({ tooth, jaw, status, hasHistory, onClick }: {
    tooth: number;
    jaw: 'upper' | 'lower';
    status: ToothStatusValue;
    hasHistory: boolean;
    onClick: () => void;
}) => {
    const colors = TOOTH_STATUS[status];
    const missing = status === 'extras' || status === 'cazut_natural';

    const number = (
        <span className='flex items-center gap-0.5 text-[10px] sm:text-xs font-medium tabular-nums text-slate-600'>
            {tooth}
            {hasHistory && <span className='h-1.5 w-1.5 rounded-full bg-teal-500' />}
        </span>
    );

    return (
        <button
            type='button'
            onClick={onClick}
            aria-label={`Dinte ${tooth}, ${colors.label.toLowerCase()}`}
            title={`${tooth} · ${colors.label}`}
            className='flex w-7 sm:w-9 cursor-pointer flex-col items-center gap-1 rounded-md p-0.5 transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-teal-500'
        >
            {jaw === 'upper' && number}
            {/* Dinții de sus sunt întorși: rădăcinile în sus, coroana spre linia de ocluzie */}
            <svg viewBox='0 0 40 48' className={cn('h-9 w-7 sm:h-11 sm:w-9', jaw === 'upper' && '-scale-y-100', missing && 'opacity-60')}>
                <path
                    d={TOOTH_PATH}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth={2}
                    strokeDasharray={status === 'cazut_natural' ? '4 3' : undefined}
                />
                {status === 'extras' && (
                    <path d='M6 6 L34 42 M34 6 L6 42' stroke={colors.stroke} strokeWidth={2.5} strokeLinecap='round' />
                )}
            </svg>
            {jaw === 'lower' && number}
        </button>
    );
};
