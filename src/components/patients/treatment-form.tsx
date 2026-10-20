'use client'

import React, { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarCheck, Check, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import type { Doctors, Service } from '@/lib/db/schema';
import { treatmentSchema, type TreatmentFormData } from '@/lib/validations/treatment';
import { createTreatment, updateTreatment, type TreatmentRow } from '@/lib/actions/treatments';
import type { TreatmentPrefill } from '@/lib/actions/appointments';
import { formatDate } from '@/lib/format';
import { ALL_TEETH, TOOTH_STATUS, TOOTH_STATUS_VALUES, toothName } from '@/lib/teeth';

export interface TreatmentFormOptions {
    patientId: string;
    doctors: Doctors[];
    services: Service[];
    currency: string;
    // Datele din programarea pacientului (medic, procedură, dată), completate automat la un tratament nou
    prefill?: TreatmentPrefill | null;
}

interface TreatmentFormProps extends TreatmentFormOptions {
    trigger: React.ReactElement;
    initialData?: TreatmentRow;
    defaultTooth?: number | null;
}

const GENERAL = 'general';
const today = () => new Date().toLocaleDateString('sv-SE');

function toFormValues(initialData?: TreatmentRow, defaultTooth?: number | null, prefill?: TreatmentPrefill | null, services: Service[] = []): TreatmentFormData {
    if (initialData) {
        return {
            toothNumber: initialData.toothNumber,
            serviceId: initialData.serviceId ?? '',
            doctorId: initialData.doctorId ?? '',
            diagnosis: initialData.diagnosis,
            treatmentDescription: initialData.treatmentDescription,
            recomendations: initialData.recomendations ?? '',
            price: Number(initialData.price ?? 0),
            paid: initialData.paid,
            performedAt: initialData.performedAt,
            newToothStatus: '', // la editare nu schimbăm starea dintelui, decât dacă medicul alege
        };
    }
    // Procedura din programare aduce și prețul și descrierea, la fel ca alegerea ei din listă
    const service = services.find((item) => item.id === prefill?.appointment?.serviceId);
    return {
        toothNumber: defaultTooth ?? null,
        serviceId: service?.id ?? '',
        doctorId: prefill?.doctorId ?? '',
        diagnosis: '',
        treatmentDescription: service?.name ?? '',
        recomendations: '',
        price: service ? Number(service.price) : 0,
        paid: false,
        performedAt: prefill?.appointment?.date ?? today(),
        newToothStatus: 'tratat',
    };
}

export const TreatmentForm = ({ patientId, doctors, services, currency, prefill, trigger, initialData, defaultTooth }: TreatmentFormProps) => {
    const [open, setOpen] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const { register, control, handleSubmit, reset, setValue, getValues, formState: { errors, isSubmitting } } = useForm<TreatmentFormData>({
        resolver: zodResolver(treatmentSchema),
        defaultValues: toFormValues(initialData, defaultTooth, prefill, services),
    });
    const toothNumber = useWatch({ control, name: 'toothNumber' });

    // În selectoare apar doar medicii/serviciile active, plus cel deja ales (la editare)
    const doctorOptions = doctors.filter((doctor) => doctor.active || doctor.id === initialData?.doctorId);
    const serviceOptions = services.filter((service) => service.active || service.id === initialData?.serviceId);

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            reset(toFormValues(initialData, defaultTooth, prefill, services));
            setErrorMessage('');
        }
        setOpen(isOpen);
    };

    // Alegerea serviciului completează prețul și, dacă e goală, descrierea
    const handleServiceChange = (serviceId: string) => {
        setValue('serviceId', serviceId);
        const service = services.find((item) => item.id === serviceId);
        if (!service) return;
        setValue('price', Number(service.price), { shouldValidate: true });
        if (!getValues('treatmentDescription').trim()) {
            setValue('treatmentDescription', service.name, { shouldValidate: true });
        }
    };

    const onSubmit = async (data: TreatmentFormData) => {
        setErrorMessage('');
        try {
            const result = initialData
                ? await updateTreatment(initialData.id, data)
                : await createTreatment(patientId, data);
            if (!result.success) {
                setErrorMessage(result.error ?? '');
                return;
            }
            setSuccess(true);
            // La un tratament nou, serverul marchează și programarea din acea zi ca „Finalizat”
            const finishedAt = 'finishedAppointmentTime' in result ? result.finishedAppointmentTime : null;
            toast.add({
                title: initialData ? 'Tratament actualizat' : 'Tratament adăugat',
                description: finishedAt ? `Programarea de la ${finishedAt} a fost marcată „Finalizat” în calendar.` : undefined,
                type: 'success',
            });
            setTimeout(() => {
                setOpen(false);
                setSuccess(false);
            }, 300);
        } catch {
            setErrorMessage('A apărut o eroare, încearcă mai târziu');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger render={trigger} />
            <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Editează tratamentul' : 'Tratament nou'}</DialogTitle>
                    <DialogDescription>Câmpurile marcate cu * sunt obligatorii</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
                    {/* Tratament nou pentru o programare: spunem de unde vin datele completate și arătăm motivul vizitei */}
                    {!initialData && prefill?.appointment && (
                        <div className='flex gap-3 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900'>
                            <CalendarCheck className='h-5 w-5 shrink-0 text-teal-600' />
                            <div className='flex flex-col gap-0.5'>
                                <p>
                                    Completat din programarea{' '}
                                    <span className='font-semibold'>
                                        {prefill.appointment.date === today() ? 'de azi' : `din ${formatDate(prefill.appointment.date)}`}, ora {prefill.appointment.time}
                                    </span>
                                    {prefill.appointment.doctorName && <> · Dr. {prefill.appointment.doctorName}</>}
                                </p>
                                {prefill.appointment.reason && <p><span className='text-teal-700'>Motivul vizitei:</span> {prefill.appointment.reason}</p>}
                                {prefill.appointment.notes && <p><span className='text-teal-700'>Note:</span> {prefill.appointment.notes}</p>}
                                <p className='text-xs text-teal-700'>La salvare, programarea va fi marcată „Finalizat”.</p>
                            </div>
                        </div>
                    )}
                    <div className='grid gap-4 sm:grid-cols-2'>
                        <Field label='Dinte'>
                            <Controller
                                control={control}
                                name='toothNumber'
                                render={({ field }) => (
                                    <Select
                                        value={field.value === null ? GENERAL : String(field.value)}
                                        onValueChange={(value) => field.onChange(value === GENERAL || value === null ? null : Number(value))}
                                    >
                                        <SelectTrigger className='w-full cursor-pointer'>
                                            <SelectValue>
                                                {field.value === null ? 'General (fără dinte)' : `${field.value} · ${toothName(field.value)}`}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={GENERAL}>General (fără dinte)</SelectItem>
                                            {ALL_TEETH.map((tooth) => (
                                                <SelectItem key={tooth} value={String(tooth)}>{tooth} · {toothName(tooth)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </Field>

                        {toothNumber !== null && (
                            <Field label='Starea dintelui după tratament'>
                                <Controller
                                    control={control}
                                    name='newToothStatus'
                                    render={({ field }) => (
                                        <Select value={field.value || null} onValueChange={(value) => field.onChange(value ?? '')}>
                                            <SelectTrigger className='w-full cursor-pointer'>
                                                <SelectValue placeholder='Nu se schimbă'>
                                                    {field.value ? TOOTH_STATUS[field.value].label : undefined}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TOOTH_STATUS_VALUES.map((status) => (
                                                    <SelectItem key={status} value={status}>{TOOTH_STATUS[status].label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </Field>
                        )}

                        <Field label='Serviciu'>
                            <Controller
                                control={control}
                                name='serviceId'
                                render={({ field }) => (
                                    <Select value={field.value || null} onValueChange={(value) => handleServiceChange(value ?? '')}>
                                        <SelectTrigger className='w-full cursor-pointer'>
                                            <SelectValue placeholder='Alege serviciul'>
                                                {serviceOptions.find((service) => service.id === field.value)?.name}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {serviceOptions.map((service) => (
                                                <SelectItem key={service.id} value={service.id}>
                                                    {service.name} · {service.price} {currency}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </Field>

                        <Field label='Medic'>
                            <Controller
                                control={control}
                                name='doctorId'
                                render={({ field }) => (
                                    <Select value={field.value || null} onValueChange={(value) => field.onChange(value ?? '')}>
                                        <SelectTrigger className='w-full cursor-pointer'>
                                            <SelectValue placeholder='Alege medicul'>
                                                {(() => {
                                                    const doctor = doctorOptions.find((item) => item.id === field.value);
                                                    return doctor ? `Dr. ${doctor.lastName} ${doctor.firstName}` : undefined;
                                                })()}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {doctorOptions.map((doctor) => (
                                                <SelectItem key={doctor.id} value={doctor.id}>Dr. {doctor.lastName} {doctor.firstName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </Field>
                    </div>

                    <Field label='Diagnostic' required error={errors.diagnosis?.message}>
                        <Input placeholder='ex. Carie mezială' {...register('diagnosis')} />
                    </Field>
                    <Field label='Tratament efectuat' required error={errors.treatmentDescription?.message}>
                        <Textarea placeholder='ex. Obturație compozit fotopolimerizabil' {...register('treatmentDescription')} />
                    </Field>
                    <Field label='Recomandări' error={errors.recomendations?.message}>
                        <Textarea placeholder='ex. Control peste 6 luni' {...register('recomendations')} />
                    </Field>

                    <div className='grid gap-4 sm:grid-cols-3 sm:items-start'>
                        <Field label={`Preț (${currency})`} required error={errors.price?.message}>
                            <Input type='number' min={0} step='0.01' {...register('price', { valueAsNumber: true })} />
                        </Field>
                        <Field label='Data' required error={errors.performedAt?.message}>
                            <Input type='date' max={today()} {...register('performedAt')} />
                        </Field>
                        <Controller
                            control={control}
                            name='paid'
                            render={({ field }) => (
                                <label className='flex items-center gap-2 text-sm font-medium cursor-pointer sm:mt-8'>
                                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                                    Achitat
                                </label>
                            )}
                        />
                    </div>

                    {errorMessage && <p className='text-sm text-red-600'>{errorMessage}</p>}
                    <Button type='submit' disabled={isSubmitting} className='self-end bg-teal-500 hover:bg-teal-600 cursor-pointer'>
                        {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                        {success ? <>Salvat<Check className='ml-2 h-4 w-4' /></> : initialData ? 'Salvează modificările' : 'Adaugă tratament'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const Field = ({ label, required, error, children }: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) => (
    <div className='flex flex-col gap-2'>
        <Label>{label}{required && <span className='text-red-500'>*</span>}</Label>
        {children}
        {error && <p className='text-sm text-red-600'>{error}</p>}
    </div>
);
