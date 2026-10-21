import { Users } from 'lucide-react';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { firstParam } from '@/lib/search-params';
import { getPatients, type PatientStatusFilter } from '@/lib/actions/patient';
import { PAGE_CLASS } from '@/lib/ui-classes';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
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
        <div className={PAGE_CLASS}>
            {/* Butonul „Pacient nou” e în topbar (merge de pe orice pagină), deci nu-l repetăm aici */}
            <PageHeader clinicName={clinic?.clinicName} trail={[{ label: 'Pacienți' }]} title='Pacienți' />

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
                q ? (
                    <EmptyState icon={Users} title={`Niciun rezultat pentru „${q}”`} description='Verifică numele, telefonul sau IDNP-ul.' />
                ) : status === 'activ' ? (
                    <EmptyState icon={Users} title='Niciun pacient încă' description='Adaugă primul pacient al clinicii.' action={<AddPatientButton />} />
                ) : (
                    <EmptyState icon={Users} title={status === 'inactiv' ? 'Niciun pacient arhivat' : 'Niciun pacient'} />
                )
            )}
        </div>
    );
}
