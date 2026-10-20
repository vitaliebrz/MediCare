'use client'

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileDown, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buttonVariants } from '@/components/ui/button';
import { PeriodSelect } from '@/components/dashboard/period-select';
import { cn } from '@/lib/utils';
import { REPORT_META, reportQuery, type ReportParams } from '@/lib/reports/params';
import type { Doctors } from '@/lib/db/schema';

const ALL = 'toti';

interface ReportFiltersProps {
    params: ReportParams;
    periodLabel: string;
    months: { key: string; label: string }[];
    doctors: Doctors[];
}

// Filtrele stau în URL, ca raportul să poată fi reîncărcat sau trimis ca link
export const ReportFilters = ({ params, periodLabel, months, doctors }: ReportFiltersProps) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { kind, doctorId } = params;

    // Parametrii păstrați când se schimbă perioada: raportul și medicul
    const keep: Record<string, string> = {};
    if (kind !== 'financiar') keep.raport = kind;
    if (doctorId && REPORT_META[kind].doctorFilter) keep.medic = doctorId;

    const changeDoctor = (value: string | null) => {
        const next = value && value !== ALL ? value : undefined;
        startTransition(() => router.replace(`/rapoarte${reportQuery({ ...params, doctorId: next })}`));
    };

    return (
        <div className='flex flex-wrap items-center gap-2'>
            {isPending && <Loader2 className='h-4 w-4 animate-spin text-slate-400' />}
            <PeriodSelect value={params.periodKey} label={periodLabel} months={months} basePath='/rapoarte' query={keep} />

            {REPORT_META[kind].doctorFilter && (
                <Select value={doctorId ?? ALL} onValueChange={changeDoctor}>
                    <SelectTrigger className='w-48 cursor-pointer bg-white' aria-label='Medic'>
                        <SelectValue>
                            {(() => {
                                const doctor = doctors.find((item) => item.id === doctorId);
                                return doctor ? `Dr. ${doctor.lastName}` : 'Toți medicii';
                            })()}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Toți medicii</SelectItem>
                        {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>Dr. {doctor.lastName} {doctor.firstName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {/* PDF-ul raportului întreg, cu aceleași filtre; în tab nou (de acolo se printează sau se salvează) */}
            <a
                href={`/rapoarte/pdf${reportQuery(params)}`}
                target='_blank'
                rel='noopener'
                className={cn(buttonVariants(), 'gap-2 bg-teal-500 hover:bg-teal-600')}
            >
                <FileDown className='h-4 w-4' /> PDF
            </a>
        </div>
    );
};
