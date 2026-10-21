import Link from 'next/link';
import { AlertTriangle, Download, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TABLE_HEAD_ROW_CLASS, TABLE_WRAPPER_CLASS, pillClass } from '@/lib/ui-classes';
import { formatDate, formatMoney } from '@/lib/format';
import type { getPatients } from '@/lib/actions/patient';

type PatientsResult = Awaited<ReturnType<typeof getPatients>>;
type PatientRow = PatientsResult['patients'][number];

// Cost / Achitat / Datorie: aceleași 3 celule în rândurile pacienților și în linia Total
const MoneyCells = ({ cost, paid, currency }: { cost: number; paid: number; currency: string }) => {
    const debt = cost - paid;
    return (
        <>
            <TableCell className='text-right tabular-nums whitespace-nowrap'>{formatMoney(cost, currency)}</TableCell>
            <TableCell className='text-right tabular-nums whitespace-nowrap text-green-700'>{formatMoney(paid, currency)}</TableCell>
            {/* Datoria e evidențiată doar când există */}
            <TableCell className={cn('text-right tabular-nums whitespace-nowrap', debt > 0 ? 'font-semibold text-amber-700' : 'text-slate-400')}>
                {formatMoney(debt, currency)}
            </TableCell>
        </>
    );
};

// Linkul către PDF-ul fișei. <a> simplu, nu <Link>: e un fișier generat de server, nu o pagină a aplicației.
export const medicalRecordHref = (patientId: string, download = false) =>
    `/fise-medicale/${patientId}/pdf${download ? '?descarca=1' : ''}`;

interface MedicalRecordTableProps {
    patients: PatientRow[];
    // Totalurile pentru toți pacienții din filtru (nu doar pagina curentă) și câți sunt
    totals: NonNullable<PatientsResult['totals']>;
    totalPatients: number;
    currency: string;
}

export const MedicalRecordTable = ({ patients, totals, totalPatients, currency }: MedicalRecordTableProps) => (
    <div className={TABLE_WRAPPER_CLASS}>
        <Table>
            <TableHeader>
                <TableRow className={TABLE_HEAD_ROW_CLASS}>
                    <TableHead className='w-16'>Nr. fișă</TableHead>
                    <TableHead>Pacient</TableHead>
                    <TableHead>IDNP</TableHead>
                    <TableHead>Ultimul tratament</TableHead>
                    <TableHead>Tratamente</TableHead>
                    <TableHead className='text-right'>Cost servicii</TableHead>
                    <TableHead className='text-right'>Achitat</TableHead>
                    <TableHead className='text-right'>Datorie</TableHead>
                    <TableHead>Fișa 043/e</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {patients.map((patient) => (
                    <TableRow key={patient.id}>
                        <TableCell className='font-semibold tabular-nums'>{patient.recordNumber ?? '—'}</TableCell>
                        <TableCell>
                            <Link href={`/pacienti/${patient.id}`} className='font-medium hover:text-teal-600 hover:underline'>
                                {patient.lastName} {patient.firstName}
                            </Link>
                        </TableCell>
                        <TableCell className='tabular-nums'>
                            {patient.idnp ?? (
                                // Fișa se poate genera, dar IDNP-ul ar trebui completat înainte de printare
                                <span
                                    className={pillClass('amber')}
                                    title='Completează IDNP-ul în fișa pacientului înainte de printare'
                                >
                                    <AlertTriangle className='h-3 w-3' /> Date incomplete
                                </span>
                            )}
                        </TableCell>
                        <TableCell className='tabular-nums'>{formatDate(patient.lastTreatmentOn)}</TableCell>
                        <TableCell className='tabular-nums'>{patient.treatmentCount}</TableCell>
                        <MoneyCells cost={patient.totalCost} paid={patient.totalPaid} currency={currency} />
                        <TableCell>
                            <div className='flex gap-2'>
                                <a
                                    href={medicalRecordHref(patient.id)}
                                    target='_blank'
                                    rel='noopener'
                                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
                                >
                                    <Eye /> Deschide
                                </a>
                                <a
                                    href={medicalRecordHref(patient.id, true)}
                                    className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 bg-teal-500 hover:bg-teal-600')}
                                >
                                    <Download /> PDF
                                </a>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableFooter>
                <TableRow className='font-semibold'>
                    <TableCell colSpan={5}>
                        Total
                        <span className='ml-1 font-normal text-slate-500'>
                            ({totalPatients} {totalPatients === 1 ? 'pacient' : 'pacienți'}{totalPatients > patients.length ? ', toate paginile' : ''})
                        </span>
                    </TableCell>
                    <MoneyCells cost={totals.cost} paid={totals.paid} currency={currency} />
                    <TableCell />
                </TableRow>
            </TableFooter>
        </Table>
    </div>
);
