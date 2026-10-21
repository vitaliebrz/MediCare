'use client';

import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { updateNotificationSettings } from '@/lib/actions/notifications';
import { PRIMARY_BUTTON_CLASS } from '@/lib/ui-classes';
import { notificationSettingsSchema, type NotificationSettingsFormData } from '@/lib/validations/notifications';

type ToggleKey = 'unconfirmedAppointments' | 'pendingAppointments' | 'oldDebts' | 'incompleteData' | 'recall' | 'birthdays';
type ThresholdKey = 'debtDays' | 'recallMonths';

// Câte un rând pentru fiecare alertă; unele au și un prag (zile / luni)
const ROWS: { key: ToggleKey; label: string; description: string; threshold?: { key: ThresholdKey; prefix: string; unit: string; max: number } }[] = [
    { key: 'unconfirmedAppointments', label: 'Programări neconfirmate', description: 'Programările de azi și de mâine cu statusul „Programat”: sună pacientul și confirmă.' },
    { key: 'pendingAppointments', label: 'Programări fără status final', description: 'Ora programării a trecut, dar n-ai marcat încă Finalizat, Anulat sau Neprezentat.' },
    { key: 'oldDebts', label: 'Datorii vechi', description: 'Pacienți cu tratamente neachitate.', threshold: { key: 'debtDays', prefix: 'mai vechi de', unit: 'zile', max: 365 } },
    { key: 'incompleteData', label: 'Date incomplete', description: 'Pacienți adăugați rapid dintr-o programare, fără IDNP.' },
    { key: 'recall', label: 'De rechemat', description: 'Pacienți activi fără nicio programare viitoare.', threshold: { key: 'recallMonths', prefix: 'fără vizită de peste', unit: 'luni', max: 36 } },
    { key: 'birthdays', label: 'Zile de naștere', description: 'Pacienții care își serbează ziua de naștere azi.' },
];

export const NotificationSettingsForm = ({ initialData }: { initialData: NotificationSettingsFormData }) => {
    const { control, register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset } = useForm<NotificationSettingsFormData>({
        resolver: zodResolver(notificationSettingsSchema),
        defaultValues: initialData,
    });
    const values = useWatch({ control });
    const [errorMessage, setErrorMessage] = useState('');

    const onSubmit = async (data: NotificationSettingsFormData) => {
        setErrorMessage('');
        try {
            const result = await updateNotificationSettings(data);
            if (!result.success) {
                setErrorMessage(result.error ?? '');
                return;
            }
            reset(data); // valorile salvate devin noul punct de plecare (butonul redevine inactiv)
            toast.add({ title: 'Setări salvate', description: 'Clopoțelul arată acum doar alertele alese.', type: 'success' });
        } catch {
            setErrorMessage('Eroare de conexiune. Verifică internetul și încearcă din nou.');
        }
    };

    return (
        <Card className='max-w-2xl'>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 p-2'>
                    <ul className='flex flex-col divide-y'>
                        {ROWS.map((row) => {
                            const enabled = values[row.key] ?? true;
                            const thresholdError = row.threshold && errors[row.threshold.key]?.message;
                            return (
                                <li key={row.key} className='flex items-start justify-between gap-4 py-3'>
                                    <div className='flex flex-col gap-1'>
                                        <label htmlFor={row.key} className='font-medium'>{row.label}</label>
                                        <p className='text-sm text-slate-500'>{row.description}</p>
                                        {row.threshold && (
                                            <div className='flex items-center gap-2 text-sm text-slate-600'>
                                                <span>{row.threshold.prefix}</span>
                                                <Input
                                                    type='number'
                                                    min={1}
                                                    max={row.threshold.max}
                                                    // readOnly, nu disabled: react-hook-form ar trimite un câmp disabled ca gol
                                                    readOnly={!enabled}
                                                    aria-disabled={!enabled}
                                                    aria-label={`${row.label}: ${row.threshold.prefix} (${row.threshold.unit})`}
                                                    className={`h-8 w-20 ${enabled ? '' : 'opacity-50'}`}
                                                    {...register(row.threshold.key, { valueAsNumber: true })}
                                                />
                                                <span>{row.threshold.unit}</span>
                                            </div>
                                        )}
                                        {thresholdError && <p className='text-sm text-red-600'>{thresholdError}</p>}
                                    </div>
                                    <Controller
                                        control={control}
                                        name={row.key}
                                        render={({ field }) => (
                                            <Switch
                                                id={row.key}
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className='mt-1 shrink-0 cursor-pointer data-checked:bg-teal-500'
                                            />
                                        )}
                                    />
                                </li>
                            );
                        })}
                    </ul>

                    {errorMessage && <p className='text-sm text-red-600'>{errorMessage}</p>}
                    <Button type='submit' disabled={isSubmitting || !isDirty} className={`self-end ${PRIMARY_BUTTON_CLASS}`}>
                        {isSubmitting ? <Loader2 className='h-4 w-4 animate-spin' /> : !isDirty && <Check className='h-4 w-4' />}
                        {isDirty ? 'Salvează' : 'Salvat'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
