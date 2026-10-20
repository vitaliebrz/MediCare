'use client'

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type { ToothStatusValue } from '@/lib/db/schema';
import { setToothStatus, type TreatmentRow } from '@/lib/actions/treatments';
import { TOOTH_STATUS, TOOTH_STATUS_VALUES, toothName } from '@/lib/teeth';
import { formatDate, formatMoney } from '@/lib/format';
import { TreatmentForm, type TreatmentFormOptions } from './treatment-form';

interface ToothPanelProps extends TreatmentFormOptions {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tooth: number | null;
    status: ToothStatusValue;
    treatments: TreatmentRow[];
}

export const ToothPanel = ({ open, onOpenChange, tooth, status, treatments, ...formOptions }: ToothPanelProps) => {
    const [saving, setSaving] = useState(false);

    const handleStatusChange = async (newStatus: ToothStatusValue) => {
        if (tooth === null || newStatus === status) return;
        setSaving(true);
        try {
            const result = await setToothStatus(formOptions.patientId, tooth, newStatus);
            if (!result.success) {
                toast.add({ title: 'Starea nu a fost salvată', description: result.error, type: 'error' });
            }
        } catch {
            toast.add({ title: 'Eroare de conexiune', description: 'Verifică internetul și încearcă din nou', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className='w-full sm:max-w-md overflow-y-auto'>
                {tooth !== null && (
                    <>
                        <SheetHeader>
                            <SheetTitle className='text-lg'>Dinte {tooth}</SheetTitle>
                            <SheetDescription>{toothName(tooth)}</SheetDescription>
                        </SheetHeader>

                        <div className='flex flex-col gap-6 px-4 pb-6'>
                            {/* Schimbare rapidă a stării, fără tratament (ex. dinte găsit extras la consult) */}
                            <div className='flex flex-col gap-2'>
                                <Label className='flex items-center gap-2'>
                                    Starea dintelui {saving && <Loader2 className='h-3 w-3 animate-spin' />}
                                </Label>
                                <Select value={status} onValueChange={(value) => value && handleStatusChange(value as ToothStatusValue)} disabled={saving}>
                                    <SelectTrigger className='w-full cursor-pointer'>
                                        <SelectValue>{TOOTH_STATUS[status].label}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TOOTH_STATUS_VALUES.map((value) => (
                                            <SelectItem key={value} value={value}>{TOOTH_STATUS[value].label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <TreatmentForm
                                {...formOptions}
                                defaultTooth={tooth}
                                trigger={
                                    <Button className='bg-teal-500 hover:bg-teal-600 cursor-pointer gap-2'>
                                        <Plus className='h-4 w-4' /> Adaugă tratament pe dintele {tooth}
                                    </Button>
                                }
                            />

                            <div className='flex flex-col gap-3'>
                                <h3 className='font-semibold'>Istoric pe acest dinte</h3>
                                {treatments.length === 0 ? (
                                    <p className='text-sm text-slate-500'>Niciun tratament pe acest dinte.</p>
                                ) : (
                                    <ul className='flex flex-col gap-3'>
                                        {treatments.map((treatment) => (
                                            <li key={treatment.id} className='rounded-md border p-3 text-sm'>
                                                <div className='flex items-center justify-between gap-2'>
                                                    <span className='font-medium'>{treatment.diagnosis}</span>
                                                    <span className='text-xs tabular-nums text-slate-500'>{formatDate(treatment.performedAt)}</span>
                                                </div>
                                                <p className='mt-1 text-slate-600'>{treatment.treatmentDescription}</p>
                                                {treatment.recomendations && (
                                                    <p className='mt-1 text-xs text-slate-500'>Recomandări: {treatment.recomendations}</p>
                                                )}
                                                <div className='mt-2 flex items-center justify-between text-xs text-slate-500'>
                                                    <span>{treatment.doctorName ? `Dr. ${treatment.doctorName} ${treatment.doctorFirstName}` : 'Medic nespecificat'}</span>
                                                    <span className='flex items-center gap-2'>
                                                        {formatMoney(treatment.price, formOptions.currency)}
                                                        <span className={cn('rounded-xl px-2 py-0.5',
                                                            treatment.paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                                                            {treatment.paid ? 'Achitat' : 'Neachitat'}
                                                        </span>
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
};
