import { Users } from 'lucide-react';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { firstParam } from '@/lib/search-params';
import { getPatients, type PatientStatusFilter } from '@/lib/actions/patient';
import { AddPatientButton } from '@/components/patients/add-patient-button';
import { PatientFilters } from '@/components/patients/patient-filters';
import { PatientTable } from '@/components/patients/patient-table';
import { PatientPagination } from '@/components/patients/patient-pagination';

const STATUS_FILTERS: PatientStatusFilter[] = ['activ', 'inactiv', 'toate'];

export default async function PacientiPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string | string[]; status?: string; page?: string }>;
}) {
    // Valorile din URL pot fi orice (le scrie utilizatorul), deci le verificăm
    const params = await searchParams;
    const q = firstParam(params.q)?.trim() ?? '';
    const status = STATUS_FILTERS.includes(params.status as PatientStatusFilter)
        ? params.status as PatientStatusFilter
        : 'activ';
    const requestedPage = Number(params.page) || 1;

    const [clinic, result] = await Promise.all([
        getClinicSettings(),
        getPatients({ q, status, page: requestedPage }),
    ]);


    return (
        <div className='p-4 md:p-8 flex flex-col gap-4'>
            <p className='text-slate-500 mt-2'>{clinic?.clinicName ?? 'Clinica'}/Pacienți</p>
            {/* Butonul „Pacient nou” e în topbar (merge de pe orice pagină), deci nu-l repetăm aici */}
            <h1 className='text-2xl font-bold'>Pacienți</h1>

            <PatientFilters q={q} status={status} />

            {result.patients.length > 0 ? (
                <>
                    <PatientTable patients={result.patients} />
                    <PatientPagination
                        page={result.page}
                        totalPages={result.totalPages}
                        total={result.total}
                        q={q}
                        status={status}
                    />
                </>
            ) : (
                <div className='flex flex-col items-center gap-3 rounded-md border border-dashed bg-white py-16 text-center'>
                    <Users className='h-10 w-10 text-slate-300' />
                    {q ? (
                        <p className='text-slate-500'>Niciun rezultat pentru „{q}”.</p>
                    ) : status === 'activ' ? (
                        <>
                            <p className='font-medium'>Niciun pacient încă</p>
                            <p className='text-sm text-slate-500'>Adaugă primul pacient al clinicii.</p>
                            <AddPatientButton />
                        </>
                    ) : (
                        <p className='text-slate-500'>Niciun pacient {status === 'inactiv' ? 'arhivat' : ''}.</p>
                    )}
                </div>
            )}
        </div>
    );
}
