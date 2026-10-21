'use client'

import { useState } from 'react';
import Link from 'next/link';
import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { ICON_BUTTON_CLASS, ICON_DELETE_BUTTON_CLASS, TABLE_HEAD_ROW_CLASS, TABLE_WRAPPER_CLASS, pillClass } from '@/lib/ui-classes';
import type { Patient } from '@/lib/db/schema';
import { deletePatient, setPatientStatus } from '@/lib/actions/patient';
import { calculateAge } from '@/lib/patient-age';
import { PatientForm } from './patientForm';

interface PatientTableProps {
    patients: Patient[];
}

export const PatientTable = ({ patients }: PatientTableProps) => {
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Execută o acțiune pe un rând și arată un toast dacă eșuează
    const runAction = async (id: string, action: () => Promise<{ success: boolean; error?: string }>, failTitle: string) => {
        setPendingId(id);
        try {
            const result = await action();
            if (!result.success) {
                toast.add({ title: failTitle, description: result.error ?? 'Încearcă din nou.', type: 'error' });
            }
        } catch {
            toast.add({ title: 'Eroare de conexiune', description: 'Verifică internetul și încearcă din nou', type: 'error' });
        } finally {
            setPendingId(null);
        }
    };

    const handleToggleStatus = (patient: Patient) =>
        runAction(
            patient.id,
            () => setPatientStatus(patient.id, patient.status === 'activ' ? 'inactiv' : 'activ'),
            'Statusul nu a putut fi schimbat',
        );

    const handleDelete = async (id: string) => {
        await runAction(id, () => deletePatient(id), 'Ștergere eșuată');
        setDeleteId(null);
    };

    const patientToDelete = patients.find((patient) => patient.id === deleteId);

    return (
        <div className={TABLE_WRAPPER_CLASS}>
            <Table>
                <TableHeader>
                    <TableRow className={TABLE_HEAD_ROW_CLASS}>
                        <TableHead>Pacient</TableHead>
                        <TableHead>IDNP</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Vârstă</TableHead>
                        <TableHead>Categorie</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Acțiuni</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {patients.map((patient) => {
                        const age = calculateAge(patient.birthDate);
                        const isActive = patient.status === 'activ';
                        return (
                            <TableRow key={patient.id} className={cn(!isActive && 'text-zinc-400')}>
                                <TableCell>
                                    <Link href={`/pacienti/${patient.id}`} className='font-medium hover:text-teal-600 hover:underline'>
                                        {patient.lastName} {patient.firstName}
                                    </Link>
                                    {patient.email && <div className='text-sm text-muted-foreground'>{patient.email}</div>}
                                </TableCell>
                                <TableCell className='tabular-nums'>
                                    {/* Fără IDNP = pacient creat rapid dintr-o programare */}
                                    {patient.idnp ?? (
                                        <span className={pillClass('amber')}>Date incomplete</span>
                                    )}
                                </TableCell>
                                <TableCell className='tabular-nums'>{patient.phone}</TableCell>
                                <TableCell>{age === null ? '—' : `${age} ani`}</TableCell>
                                <TableCell>
                                    <span className={pillClass(patient.category === 'copil' ? 'teal' : 'neutral')}>
                                        {patient.category === 'copil' ? 'Copil' : 'Adult'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className={pillClass(isActive ? 'green' : 'neutral')}>
                                        {isActive ? 'Activ' : 'Arhivat'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className='flex gap-2'>
                                        <PatientForm
                                            initialData={patient}
                                            trigger={<Button className={ICON_BUTTON_CLASS} title='Editează'><Pencil /></Button>}
                                        />
                                        <Button
                                            className={ICON_BUTTON_CLASS}
                                            title={isActive ? 'Arhivează' : 'Reactivează'}
                                            disabled={pendingId === patient.id}
                                            onClick={() => handleToggleStatus(patient)}
                                        >
                                            {isActive ? <Archive /> : <ArchiveRestore />}
                                        </Button>
                                        <Button
                                            className={ICON_DELETE_BUTTON_CLASS}
                                            title='Șterge definitiv'
                                            disabled={pendingId === patient.id}
                                            onClick={() => setDeleteId(patient.id)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {/* Un singur dialog pentru tot tabelul, deschis pentru pacientul ales */}
            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => { if (!open) setDeleteId(null) }}
                title='Ștergeți pacientul definitiv?'
                description={<>
                    Se vor șterge definitiv{' '}
                    <span className='font-semibold'>{patientToDelete?.lastName} {patientToDelete?.firstName}</span>
                    {' '}și tot istoricul de tratamente. Dacă vreți doar să-l ascundeți din listă, folosiți „Arhivează”.
                </>}
                pending={deleteId !== null && pendingId === deleteId}
                onConfirm={() => deleteId && handleDelete(deleteId)}
            />
        </div>
    );
};
