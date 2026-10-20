'use client'

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PatientStatusFilter } from '@/lib/actions/patient';

interface PatientFiltersProps {
    q: string;
    status: PatientStatusFilter;
    basePath?: string; // pagina pe care stau filtrele (lista e folosită și în /fise-medicale)
}

// Filtrele stau în URL (?q=...&status=...), nu în useState:
// pagina se poate reîncărca sau trimite ca link și arată aceleași rezultate.
export const PatientFilters = ({ q, status, basePath = '/pacienti' }: PatientFiltersProps) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Câmp controlat: textul din input e în state, ca să-l putem goli și din afară
    const [search, setSearch] = useState(q);
    // Ultima căutare trimisă de noi în URL și ultimul q văzut
    const [sentQ, setSentQ] = useState(q);
    const [prevQ, setPrevQ] = useState(q);

    // Dacă ?q= din URL s-a schimbat din altă parte (pacient nou adăugat, butonul Back),
    // afișăm în input ce e în URL. Ajustare în timpul render-ului, fără useEffect:
    // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
    if (q !== prevQ) {
        setPrevQ(q);
        if (q !== sentQ) {
            setSearch(q);
            setSentQ(q);
        }
    }

    const updateUrl = (next: { q?: string; status?: PatientStatusFilter }) => {
        const params = new URLSearchParams();
        const nextQ = next.q ?? q;
        const nextStatus = next.status ?? status;
        if (nextQ) params.set('q', nextQ);
        if (nextStatus !== 'activ') params.set('status', nextStatus);
        // La orice filtru nou revenim la pagina 1, deci nu punem ?page
        const query = params.toString();
        startTransition(() => {
            router.replace(query ? `${basePath}?${query}` : basePath);
        });
    };

    // Debounce: așteptăm 300 ms după ultima tastă, ca să nu cerem date la fiecare literă
    const handleSearchChange = (value: string) => {
        setSearch(value);
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setSentQ(value.trim());
            updateUrl({ q: value.trim() });
        }, 300);
    };

    return (
        <div className='flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between'>
            <Tabs value={status} onValueChange={(value) => updateUrl({ status: value as PatientStatusFilter })}>
                <TabsList>
                    <TabsTrigger value='activ'>Activi</TabsTrigger>
                    <TabsTrigger value='inactiv'>Arhivați</TabsTrigger>
                    <TabsTrigger value='toate'>Toți</TabsTrigger>
                </TabsList>
            </Tabs>
            <div className='relative w-full md:w-80'>
                {isPending
                    ? <Loader2 className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400' />
                    : <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />}
                <Input
                    type='search'
                    placeholder='Caută după nume, telefon sau IDNP'
                    value={search}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className='pl-9'
                />
            </div>
        </div>
    );
};
