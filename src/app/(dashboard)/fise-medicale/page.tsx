import { FileText } from 'lucide-react';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { firstParam } from '@/lib/search-params';
import { getPatients, type PatientStatusFilter } from '@/lib/actions/patient';
import { PatientFilters } from '@/components/patients/patient-filters';
import { PatientPagination } from '@/components/patients/patient-pagination';
import { MedicalRecordTable } from '@/components/medical-record/medical-record-table';

const STATUS_FILTERS: PatientStatusFilter[] = ['activ', 'inactiv', 'toate'];
const BASE_PATH = '/fise-medicale';

export default async function FiseMedicalePage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string | string[]; status?: string; page?: string }>;
}) {
    // Aceleași filtre ca lista de pacienți; valorile din URL pot fi orice, deci le verificăm
    const params = await searchParams;
    const q = firstParam(params.q)?.trim() ?? '';
    const status = STATUS_FILTERS.includes(params.status as PatientStatusFilter)
        ? params.status as PatientStatusFilter
        : 'activ';
    const requestedPage = Number(params.page) || 1;

    const [clinic, result] = await Promise.all([
        getClinicSettings(),
        getPatients({ q, status, page: requestedPage, withTotals: true }),
    ]);

    return (
        <div className='p-4 md:p-8 flex flex-col gap-4'>
            <p className='text-slate-500 mt-2'>{clinic?.clinicName ?? 'Clinica'}/Fișe medicale</p>
            <div>
                <h1 className='text-2xl font-bold'>Fișe medicale</h1>
                <p className='text-sm text-slate-500'>
                    Fișa medicală a bolnavului stomatologic (Formular 043/e), generată din datele pacientului.
                    Secțiunile fără date în aplicație se completează de mână după printare.
                </p>
            </div>

            <PatientFilters q={q} status={status} basePath={BASE_PATH} />

            {result.patients.length > 0 ? (
                <>
                    <MedicalRecordTable
                        patients={result.patients}
                        totals={result.totals!}
                        totalPatients={result.total}
                        currency={clinic?.currency ?? 'MDL'}
                    />
                    <PatientPagination
                        page={result.page}
                        totalPages={result.totalPages}
                        total={result.total}
                        q={q}
                        status={status}
                        basePath={BASE_PATH}
                    />
                </>
            ) : (
                <div className='flex flex-col items-center gap-3 rounded-md border border-dashed bg-white py-16 text-center'>
                    <FileText className='h-10 w-10 text-slate-300' />
                    <p className='text-slate-500'>{q ? `Niciun rezultat pentru „${q}”.` : 'Niciun pacient în această listă.'}</p>
                </div>
            )}
        </div>
    );
}
