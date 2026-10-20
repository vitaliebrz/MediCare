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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/db/schema';
import { deletePatient, setPatientStatus } from '@/lib/actions/patient';
import { calculateAge } from '@/lib/patient-age';
import { PatientForm } from './patientForm';

interface PatientTableProps {
    patients: Patient[];
}

const iconButton = 'bg-transparent text-zinc-500 cursor-pointer hover:bg-teal-500/50 hover:text-white';

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
        <div className='overflow-x-auto rounded-md border'>
            <Table>
                <TableHeader>
                    <TableRow className='bg-zinc-300 hover:bg-zinc-300'>
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
                                        <span className='px-2 py-1 rounded-xl text-xs bg-amber-100 text-amber-700'>Date incomplete</span>
                                    )}
                                </TableCell>
                                <TableCell className='tabular-nums'>{patient.phone}</TableCell>
                                <TableCell>{age === null ? '—' : `${age} ani`}</TableCell>
                                <TableCell>
                                    <span className={cn('px-2 py-1 rounded-xl text-xs',
                                        patient.category === 'copil' ? 'bg-teal-100 text-teal-700' : 'bg-zinc-500/20')}>
                                        {patient.category === 'copil' ? 'Copil' : 'Adult'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className={cn('px-2 py-1 rounded-xl text-xs',
                                        isActive ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-500')}>
                                        {isActive ? 'Activ' : 'Arhivat'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className='flex gap-2'>
                                        <PatientForm
                                            initialData={patient}
                                            trigger={<Button className={iconButton} title='Editează'><Pencil /></Button>}
                                        />
                                        <Button
                                            className={iconButton}
                                            title={isActive ? 'Arhivează' : 'Reactivează'}
                                            disabled={pendingId === patient.id}
                                            onClick={() => handleToggleStatus(patient)}
                                        >
                                            {isActive ? <Archive /> : <ArchiveRestore />}
                                        </Button>
                                        <Button
                                            className='cursor-pointer bg-transparent text-zinc-500 hover:bg-red-200 hover:text-red-500'
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
            <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
                <AlertDialogContent size='sm'>
                    <AlertDialogHeader>
                        <AlertDialogMedia className='bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive'>
                            <Trash2 />
                        </AlertDialogMedia>
                        <AlertDialogTitle>Ștergeți pacientul definitiv?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se vor șterge definitiv{' '}
                            <span className='font-semibold'>{patientToDelete?.lastName} {patientToDelete?.firstName}</span>
                            {' '}și tot istoricul de tratamente. Dacă vreți doar să-l ascundeți din listă, folosiți „Arhivează”.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel variant='outline'>Anulează</AlertDialogCancel>
                        <AlertDialogAction
                            variant='destructive'
                            disabled={pendingId === deleteId}
                            onClick={() => deleteId && handleDelete(deleteId)}
                        >
                            Ștergeți
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
