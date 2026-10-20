'use client'

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { deleteTreatment, setTreatmentPaid, type TreatmentRow } from '@/lib/actions/treatments';
import { formatDate, formatMoney } from '@/lib/format';
import { TreatmentForm, type TreatmentFormOptions } from './treatment-form';

interface TreatmentHistoryProps extends TreatmentFormOptions {
    treatments: TreatmentRow[];
}

const iconButton = 'bg-transparent text-zinc-500 cursor-pointer hover:bg-teal-500/50 hover:text-white';

export const TreatmentHistory = ({ treatments, ...formOptions }: TreatmentHistoryProps) => {
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

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

    const handleDelete = async (id: string) => {
        await runAction(id, () => deleteTreatment(id), 'Ștergere eșuată');
        setDeleteId(null);
    };

    return (
        <div className='flex flex-col gap-3'>
            <div className='flex flex-wrap items-end justify-between gap-2'>
                <div>
                    <h2 className='text-lg font-semibold'>Istoric tratamente ({treatments.length})</h2>
                    {treatments.length > 0 && (
                        <p className='text-sm text-slate-500'>
                            Folosește comutatorul din coloana <span className='font-medium text-slate-700'>Plată</span> ca să marchezi un tratament ca achitat sau neachitat.
                        </p>
                    )}
                </div>
                <TreatmentForm
                    {...formOptions}
                    trigger={<Button className='bg-teal-500 hover:bg-teal-600 cursor-pointer gap-2'><Plus className='h-4 w-4' /> Adaugă tratament</Button>}
                />
            </div>

            {treatments.length === 0 ? (
                <p className='rounded-md border border-dashed bg-white py-10 text-center text-slate-500'>
                    Niciun tratament înregistrat.
                </p>
            ) : (
                <div className='overflow-x-auto rounded-md border bg-white'>
                    <Table>
                        <TableHeader>
                            <TableRow className='bg-zinc-300 hover:bg-zinc-300'>
                                <TableHead>Data</TableHead>
                                <TableHead>Dinte</TableHead>
                                <TableHead>Diagnostic / tratament</TableHead>
                                <TableHead>Medic</TableHead>
                                <TableHead>Preț</TableHead>
                                <TableHead>Plată</TableHead>
                                <TableHead>Acțiuni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {treatments.map((treatment) => (
                                // Tratamentele neachitate au rândul ușor portocaliu, ca să iasă în evidență
                                <TableRow key={treatment.id} className={cn(!treatment.paid && 'bg-amber-50/60 hover:bg-amber-50')}>
                                    <TableCell className='tabular-nums'>{formatDate(treatment.performedAt)}</TableCell>
                                    <TableCell>
                                        {treatment.toothNumber ?? <span className='text-xs text-slate-500'>General</span>}
                                    </TableCell>
                                    <TableCell className='max-w-80'>
                                        <div className='font-medium'>{treatment.diagnosis}</div>
                                        <div className='text-sm text-muted-foreground line-clamp-2'>{treatment.treatmentDescription}</div>
                                    </TableCell>
                                    <TableCell>
                                        {treatment.doctorName ? `Dr. ${treatment.doctorName} ${treatment.doctorFirstName}` : '—'}
                                    </TableCell>
                                    <TableCell className='font-semibold whitespace-nowrap'>
                                        {formatMoney(treatment.price, formOptions.currency)}
                                    </TableCell>
                                    <TableCell>
                                        {/* Comutator + text: starea plății se citește direct, fără să ghicești ce înseamnă bifa */}
                                        <label className='flex w-fit items-center gap-2 whitespace-nowrap cursor-pointer'>
                                            <Switch
                                                checked={treatment.paid}
                                                disabled={pendingId === treatment.id}
                                                onCheckedChange={(checked) => runAction(
                                                    treatment.id,
                                                    () => setTreatmentPaid(treatment.id, checked),
                                                    'Statusul plății nu a putut fi schimbat',
                                                )}
                                                className='cursor-pointer data-checked:bg-green-600 data-unchecked:bg-amber-400'
                                            />
                                            <span className={cn('text-sm font-medium', treatment.paid ? 'text-green-700' : 'text-amber-700')}>
                                                {treatment.paid ? 'Achitat' : 'Neachitat'}
                                            </span>
                                        </label>
                                    </TableCell>
                                    <TableCell>
                                        <div className='flex gap-2'>
                                            <TreatmentForm
                                                {...formOptions}
                                                initialData={treatment}
                                                trigger={<Button className={iconButton} title='Editează'><Pencil /></Button>}
                                            />
                                            <Button
                                                className='cursor-pointer bg-transparent text-zinc-500 hover:bg-red-200 hover:text-red-500'
                                                title='Șterge'
                                                disabled={pendingId === treatment.id}
                                                onClick={() => setDeleteId(treatment.id)}
                                            >
                                                <Trash2 />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
                <AlertDialogContent size='sm'>
                    <AlertDialogHeader>
                        <AlertDialogMedia className='bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive'>
                            <Trash2 />
                        </AlertDialogMedia>
                        <AlertDialogTitle>Ștergeți tratamentul?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tratamentul va fi șters definitiv din istoric. Starea dintelui din schemă nu se modifică.
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
