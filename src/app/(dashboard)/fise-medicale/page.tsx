import { FileText } from 'lucide-react';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { firstParam } from '@/lib/search-params';
import { getPatients, type PatientStatusFilter } from '@/lib/actions/patient';
import { PAGE_CLASS } from '@/lib/ui-classes';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
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
        <div className={PAGE_CLASS}>
            <PageHeader
                clinicName={clinic?.clinicName}
                trail={[{ label: 'Fișe medicale' }]}
                title='Fișe medicale'
                description={<>
                    Fișa medicală a bolnavului stomatologic (Formular 043/e), generată din datele pacientului.
                    Secțiunile fără date în aplicație se completează de mână după printare.
                </>}
            />

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
                <EmptyState
                    icon={FileText}
                    title={q ? `Niciun rezultat pentru „${q}”` : 'Niciun pacient în această listă'}
                    description={q ? 'Verifică numele, telefonul sau IDNP-ul.' : undefined}
                />
            )}
        </div>
    );
}
