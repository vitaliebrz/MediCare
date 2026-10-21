'use client'

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_PERIOD } from '@/lib/dashboard-period';

interface PeriodSelectProps {
    value: string;
    label: string;
    months: { key: string; label: string }[];
    basePath?: string; // pagina pe care stă selectorul (folosit și în /rapoarte)
    query?: Record<string, string>; // ceilalți parametri din URL, păstrați la schimbarea perioadei
}

// Perioada stă în URL (?perioada=), ca pagina să poată fi reîncărcată sau trimisă ca link
export const PeriodSelect = ({ value, label, months, basePath = '/', query = {} }: PeriodSelectProps) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleChange = (next: string | null) => {
        if (!next) return;
        const params = new URLSearchParams(query);
        if (next !== DEFAULT_PERIOD) params.set('perioada', next);
        const search = params.toString();
        startTransition(() => {
            router.replace(search ? `${basePath}?${search}` : basePath);
        });
    };

    return (
        <div className='flex items-center gap-2'>
            {isPending && <Loader2 className='h-4 w-4 animate-spin text-slate-400' />}
            <Select value={value} onValueChange={handleChange}>
                <SelectTrigger className='w-56 cursor-pointer bg-white' aria-label='Perioada'>
                    <SelectValue>{label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value='7z'>Ultimele 7 zile</SelectItem>
                    <SelectItem value='30z'>Ultimele 30 de zile</SelectItem>
                    <SelectSeparator />
                    <SelectGroup>
                        <SelectLabel>Luni</SelectLabel>
                        {months.map((month) => (
                            <SelectItem key={month.key} value={month.key}>{month.label}</SelectItem>
                        ))}
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectItem value='tot'>De la început</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};
