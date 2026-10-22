import { notFound } from 'next/navigation';
import { AlertTriangle, FileText, Phone, UserPen } from 'lucide-react';
import { PAGE_CLASS, pillClass } from '@/lib/ui-classes';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getPatientChart } from '@/lib/actions/treatments';
import { getDoctors } from '@/lib/actions/doctors';
import { getServices } from '@/lib/actions/services';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { getTreatmentPrefill } from '@/lib/actions/appointments';
import { calculateAge } from '@/lib/patient-age';
import { formatDate, formatMoney } from '@/lib/format';
import type { Patient } from '@/lib/db/schema';
import { DentalChart } from '@/components/patients/dental-chart';
import { TreatmentHistory } from '@/components/patients/treatment-history';
import { EditPatientButton } from '@/components/patients/edit-patient-button';
import { medicalRecordHref } from '@/components/medical-record/medical-record-table';
import { buttonVariants } from '@/components/ui/button';

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
    // În Next.js 16, params e un Promise
    const { id } = await params;

    const [chart, doctors, services, clinic, prefill] = await Promise.all([
        getPatientChart(id),
        getDoctors(),
        getServices(),
        getClinicSettings(),
        getTreatmentPrefill(id),
    ]);
    // Pacient inexistent sau din altă clinică -> pagina 404
    if (!chart) notFound();

    const { patient, teeth, treatments } = chart;
    const currency = clinic?.currency ?? 'MDL';
    const age = calculateAge(patient.birthDate);
    // prefill: datele din programarea pacientului, completate automat la „Tratament nou”
    const formOptions = { patientId: patient.id, doctors, services, currency, prefill };

    // Sumar financiar
    const total = treatments.reduce((sum, treatment) => sum + Number(treatment.price ?? 0), 0);
    const paid = treatments.filter((treatment) => treatment.paid).reduce((sum, treatment) => sum + Number(treatment.price ?? 0), 0);
    const unpaid = total - paid;

    // Informațiile pe care medicul trebuie să le vadă înainte de orice procedură
    const alerts = [
        { label: 'Alergii', value: patient.alergie },
        { label: 'Boli cronice', value: patient.chronicDiseases },
        { label: 'Medicamente curente', value: patient.currentMedications },
    ].filter((alert) => alert.value);

    return (
        <div className={PAGE_CLASS}>
            {/* Antet: calea „Clinica › Pacienți › Nume” înlocuiește săgeata „înapoi” */}
            <PageHeader
                clinicName={clinic?.clinicName}
                trail={[{ label: 'Pacienți', href: '/pacienti' }, { label: `${patient.lastName} ${patient.firstName}` }]}
                title={
                    <span className='flex flex-wrap items-center gap-2'>
                        {patient.lastName} {patient.firstName}
                        <span className={pillClass(patient.category === 'copil' ? 'teal' : 'neutral')}>
                            {patient.category === 'copil' ? 'Copil' : 'Adult'}
                        </span>
                        {patient.status === 'inactiv' && <span className={pillClass('neutral')}>Arhivat</span>}
                    </span>
                }
                description={
                    <span className='flex flex-wrap gap-x-4 gap-y-1'>
                        {age !== null && <span>{age} ani</span>}
                        {patient.idnp && <span className='tabular-nums'>IDNP {patient.idnp}</span>}
                        <a href={`tel:${patient.phone}`} className='flex items-center gap-1 tabular-nums hover:text-teal-600'>
                            <Phone className='h-3.5 w-3.5' /> {patient.phone}
                        </a>
                    </span>
                }
                action={<>
                    {/* Fișa 043/e în PDF, în tab nou (de acolo se printează) */}
                    <a href={medicalRecordHref(patient.id)} target='_blank' rel='noopener' className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}>
                        <FileText className='h-4 w-4' /> Fișa 043/e
                    </a>
                    <EditPatientButton patient={patient} />
                </>}
            />

            {/* Pacient creat rapid dintr-o programare (doar nume + telefon): cerem completarea fișei */}
            {!patient.idnp && (
                <div role='status' className='flex flex-col gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='flex gap-3'>
                        <UserPen className='h-5 w-5 shrink-0' />
                        <div>
                            <p className='font-semibold'>Date incomplete</p>
                            <p>Pacientul a fost adăugat dintr-o programare. Completează IDNP-ul și celelalte date personale.</p>
                        </div>
                    </div>
                    <EditPatientButton patient={patient} label='Completează datele' className='shrink-0 border-amber-300 bg-white' />
                </div>
            )}

            {/* Alerte medicale */}
            {alerts.length > 0 && (
                <div role='alert' className='flex gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800'>
                    <AlertTriangle className='h-5 w-5 shrink-0' />
                    <dl className='flex flex-col gap-1'>
                        {alerts.map((alert) => (
                            <div key={alert.label}>
                                <dt className='inline font-semibold'>{alert.label}: </dt>
                                <dd className='inline'>{alert.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            )}

            {/* Sumar financiar */}
            <div className='grid grid-cols-3 gap-3'>
                <SummaryCard label='Total tratamente' value={formatMoney(total, currency)} />
                <SummaryCard label='Achitat' value={formatMoney(paid, currency)} />
                <SummaryCard label='De achitat' value={formatMoney(unpaid, currency)} highlight={unpaid > 0} />
            </div>

            <Tabs defaultValue='tratamente'>
                <TabsList>
                    <TabsTrigger value='tratamente'>Schema dentară și tratamente</TabsTrigger>
                    <TabsTrigger value='date'>Date personale</TabsTrigger>
                </TabsList>
                {/* Istoricul stă sub schemă: se văd împreună dinții și tratamentele (inclusiv plata), fără a schimba fila */}
                <TabsContent value='tratamente' className='flex flex-col gap-6 pt-2'>
                    <DentalChart {...formOptions} category={patient.category} teeth={teeth} treatments={treatments} />
                    <TreatmentHistory {...formOptions} treatments={treatments} />
                </TabsContent>
                <TabsContent value='date' className='pt-2'>
                    <PersonalData patient={patient} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

const SummaryCard = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
    <div className={cn('rounded-lg border bg-white p-3 md:p-4', highlight && 'border-amber-300 bg-amber-50')}>
        <p className='text-xs text-slate-500'>{label}</p>
        <p className={cn('mt-1 font-semibold tabular-nums md:text-lg', highlight && 'text-amber-700')}>{value}</p>
    </div>
);

const PersonalData = ({ patient }: { patient: Patient }) => {
    const rows: [string, string | null][] = [
        ['Nume', patient.lastName],
        ['Prenume', patient.firstName],
        ['IDNP', patient.idnp],
        ['Data nașterii', patient.birthDate ? formatDate(patient.birthDate) : null],
        ['Sex', patient.gender === 'M' ? 'Masculin' : patient.gender === 'F' ? 'Feminin' : null],
        ['Telefon', patient.phone],
        ['Email', patient.email],
        ['Adresă', patient.address],
        ['Grupa sanguină', patient.bloodType],
        ['Alergii', patient.alergie],
        ['Boli cronice', patient.chronicDiseases],
        ['Medicamente curente', patient.currentMedications],
        ['Note', patient.notes],
    ];
    return (
        <dl className='grid grid-cols-1 gap-x-8 gap-y-3 rounded-lg border bg-white p-4 sm:grid-cols-2'>
            {rows.map(([label, value]) => (
                <div key={label}>
                    <dt className='text-xs text-slate-500'>{label}</dt>
                    <dd className='whitespace-pre-line break-words'>{value || '—'}</dd>
                </div>
            ))}
        </dl>
    );
};
