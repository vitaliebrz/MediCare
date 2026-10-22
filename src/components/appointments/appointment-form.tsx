'use client'

import React, { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Clock, Loader2, Search, Trash2, UserPlus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import type { AppointmentStatus, Category, Doctors, Service } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { appointmentSchema, APPOINTMENT_STATUS_VALUES, type AppointmentFormData, type QuickPatientData } from '@/lib/validations/appointment';
import { createAppointment, deleteAppointment, searchPatients, updateAppointment, type CalendarAppointment } from '@/lib/actions/appointments';
import { APPOINTMENT_STATUS } from '@/lib/constants/appointment-status';
import { endTime } from '@/lib/calendar';
import { StatusBadge } from './status-badge';

// Ce se completează automat la "Programare nouă" (din slotul apăsat în calendar)
export interface AppointmentDefaults {
    date: string;
    time: string;
    doctorId: string;
}

export interface AppointmentFormOptions {
    doctors: Doctors[];
    services: Service[];
    categories: Category[];
}

interface AppointmentFormProps extends AppointmentFormOptions {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: CalendarAppointment | null; // null = programare nouă
    defaults: AppointmentDefaults;
}

interface PickedPatient {
    id: string;
    name: string;
    phone: string | null;
}

// Ce a scris utilizatorul în căutare devine punctul de plecare pentru pacientul nou:
// cifre -> telefon; altfel "Popescu Ion" -> nume „Popescu”, prenume „Ion”
function quickPatientFrom(query: string): QuickPatientData {
    const text = query.trim();
    if (/^\+?[\d\s]+$/.test(text)) return { lastName: '', firstName: '', phone: text.replace(/\s/g, '') };
    const [lastName = '', ...rest] = text.split(/\s+/);
    return { lastName, firstName: rest.join(' '), phone: '' };
}

function toFormValues(appointment: CalendarAppointment | null, defaults: AppointmentDefaults): AppointmentFormData {
    if (appointment) {
        return {
            patientId: appointment.patientId,
            newPatient: null,
            serviceId: appointment.serviceId ?? '',
            doctorId: appointment.doctorId ?? '',
            date: appointment.date,
            time: appointment.time,
            reason: appointment.reason ?? '',
            notes: appointment.notes ?? '',
            status: appointment.status,
        };
    }
    return { patientId: '', newPatient: null, serviceId: '', doctorId: defaults.doctorId, date: defaults.date, time: defaults.time, reason: '', notes: '', status: 'programat' };
}

// Părintele dă formularului un `key` nou la fiecare deschidere, deci starea pornește mereu
// de la programarea apăsată sau de la slotul ales (fără reset manual).
export const AppointmentForm = ({ open, onOpenChange, appointment, defaults, doctors, services, categories }: AppointmentFormProps) => {
    const [patient, setPatient] = useState<PickedPatient | null>(
        appointment ? { id: appointment.patientId, name: appointment.patientName, phone: appointment.patientPhone } : null,
    );
    const [isNewPatient, setIsNewPatient] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<AppointmentFormData>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: toFormValues(appointment, defaults),
    });
    const [serviceId, time, status] = useWatch({ control, name: ['serviceId', 'time', 'status'] });

    // În selectoare apar doar medicii/serviciile active, plus cel deja ales (la editare)
    const doctorOptions = doctors.filter((doctor) => doctor.active || doctor.id === appointment?.doctorId);
    const serviceOptions = services.filter((service) => service.active || service.id === appointment?.serviceId);
    const serviceGroups = categories
        .map((category) => ({ category, items: serviceOptions.filter((service) => service.categoryId === category.id) }))
        .filter((group) => group.items.length > 0);

    // Durata vine din Setări → Servicii. La editare, dacă procedura nu s-a schimbat, rămâne cea salvată.
    const selectedService = services.find((service) => service.id === serviceId);
    const duration = appointment && serviceId === appointment.serviceId
        ? appointment.durationMinutes
        : selectedService?.durationMinutes;

    const pickPatient = (picked: PickedPatient | null) => {
        setPatient(picked);
        setValue('patientId', picked?.id ?? '', { shouldValidate: !!picked });
    };

    // Pacient nou, creat de server împreună cu programarea; fișa lui se completează ulterior
    const startNewPatient = (query: string) => {
        setPatient(null);
        setIsNewPatient(true);
        setValue('patientId', '');
        setValue('newPatient', quickPatientFrom(query));
    };

    const cancelNewPatient = () => {
        setIsNewPatient(false);
        setValue('newPatient', null);
    };

    const onSubmit = async (data: AppointmentFormData) => {
        setErrorMessage('');
        try {
            const result = appointment ? await updateAppointment(appointment.id, data) : await createAppointment(data);
            if (!result.success) {
                setErrorMessage(result.error ?? '');
                return;
            }
            setSuccess(true);
            toast.add({ title: appointment ? 'Programare actualizată' : 'Programare adăugată', type: 'success' });
            setTimeout(() => onOpenChange(false), 300);
        } catch {
            setErrorMessage('A apărut o eroare, încearcă mai târziu');
        }
    };

    const handleDelete = async () => {
        if (!appointment) return;
        setDeleting(true);
        const result = await deleteAppointment(appointment.id);
        setDeleting(false);
        setConfirmDelete(false);
        if (!result.success) {
            setErrorMessage(result.error ?? '');
            return;
        }
        toast.add({ title: 'Programare ștearsă', type: 'success' });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-xl max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle className='flex flex-wrap items-center gap-2'>
                        {appointment ? 'Editează programarea' : 'Programare nouă'}
                        {/* Statusul ales acum (se schimbă imediat ce alegi altul mai jos) */}
                        <StatusBadge status={status} className='text-sm' />
                    </DialogTitle>
                    <DialogDescription>Câmpurile marcate cu * sunt obligatorii</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
                    <Controller
                        control={control}
                        name='status'
                        render={({ field }) => <StatusPicker value={field.value} onChange={field.onChange} />}
                    />

                    {isNewPatient ? (
                        <div className='flex flex-col gap-3 rounded-md border border-dashed p-3'>
                            <div className='flex items-center justify-between gap-2'>
                                <p className='text-sm font-medium'>Pacient nou</p>
                                <Button type='button' variant='ghost' size='sm' className='cursor-pointer' onClick={cancelNewPatient}>
                                    <Search className='h-3.5 w-3.5' /> Caută în listă
                                </Button>
                            </div>
                            <div className='grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-start'>
                                <Field label='Nume' required error={errors.newPatient?.lastName?.message}>
                                    <Input placeholder='Popescu' {...register('newPatient.lastName')} />
                                </Field>
                                <Field label='Prenume' required error={errors.newPatient?.firstName?.message}>
                                    <Input placeholder='Ion' {...register('newPatient.firstName')} />
                                </Field>
                                <Field label='Telefon' required error={errors.newPatient?.phone?.message}>
                                    <Input type='tel' inputMode='tel' placeholder='+37369000000' {...register('newPatient.phone')} />
                                </Field>
                            </div>
                            <p className='text-xs text-slate-500'>
                                Pacientul se adaugă în listă la salvare. IDNP-ul și celelalte date se completează din fișa lui.
                            </p>
                        </div>
                    ) : (
                        <Field label='Pacient' required error={errors.patientId?.message}>
                            <PatientPicker value={patient} onChange={pickPatient} onCreateNew={startNewPatient} />
                        </Field>
                    )}

                    <Field label='Procedură' required error={errors.serviceId?.message}>
                        <Controller
                            control={control}
                            name='serviceId'
                            render={({ field }) => (
                                <Select value={field.value || null} onValueChange={(value) => field.onChange(value ?? '')}>
                                    <SelectTrigger className='w-full cursor-pointer'>
                                        <SelectValue placeholder='Alege procedura'>
                                            {serviceOptions.find((service) => service.id === field.value)?.name}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {serviceGroups.map(({ category, items }) => (
                                            <SelectGroup key={category.id}>
                                                <SelectLabel>{category.name}</SelectLabel>
                                                {items.map((service) => (
                                                    <SelectItem key={service.id} value={service.id}>
                                                        {service.name} · {service.durationMinutes} min
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {duration !== undefined && (
                            <p className='flex items-center gap-1.5 text-sm text-slate-500'>
                                <Clock className='h-3.5 w-3.5' />
                                Durată: {duration} min{/^\d{2}:\d{2}$/.test(time) && ` · se termină la ${endTime(time, duration)}`}
                            </p>
                        )}
                    </Field>

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-start'>
                        <Field label='Data' required error={errors.date?.message}>
                            <Input type='date' {...register('date')} />
                        </Field>
                        <Field label='Ora' required error={errors.time?.message}>
                            <Input type='time' step={300} {...register('time')} />
                        </Field>
                        <Field label='Medic'>
                            <Controller
                                control={control}
                                name='doctorId'
                                render={({ field }) => (
                                    <Select value={field.value || null} onValueChange={(value) => field.onChange(value ?? '')}>
                                        <SelectTrigger className='w-full cursor-pointer'>
                                            <SelectValue placeholder='Fără medic'>
                                                {(() => {
                                                    const doctor = doctorOptions.find((item) => item.id === field.value);
                                                    return doctor ? `Dr. ${doctor.lastName}` : undefined;
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

                    <Field label='Motivul vizitei' error={errors.reason?.message}>
                        <Input placeholder='ex. Durere la dintele 36' {...register('reason')} />
                    </Field>
                    <Field label='Note' error={errors.notes?.message}>
                        <Textarea placeholder='ex. Pacientul preferă să fie sunat dimineața' {...register('notes')} />
                    </Field>

                    {errorMessage && <p className='text-sm text-red-600'>{errorMessage}</p>}
                    <div className='flex items-center justify-between gap-2'>
                        {appointment ? (
                            <Button type='button' variant='ghost' className='text-red-600 hover:text-red-700 cursor-pointer gap-2' onClick={() => setConfirmDelete(true)}>
                                <Trash2 className='h-4 w-4' /> Șterge
                            </Button>
                        ) : <span />}
                        <Button type='submit' disabled={isSubmitting} className='bg-teal-500 hover:bg-teal-600 cursor-pointer'>
                            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            {success ? <>Salvat<Check className='ml-2 h-4 w-4' /></> : appointment ? 'Salvează modificările' : 'Adaugă programarea'}
                        </Button>
                    </div>
                </form>

                <ConfirmDialog
                    open={confirmDelete}
                    onOpenChange={setConfirmDelete}
                    title='Ștergeți programarea?'
                    description='Programarea va fi ștearsă definitiv. Dacă pacientul doar nu vine, alegeți statusul „Anulat” sau „Neprezentat”.'
                    pending={deleting}
                    onConfirm={handleDelete}
                />
            </DialogContent>
        </Dialog>
    );
};

// Statusul ca 5 butoane colorate (în loc de listă derulantă), ca să se vadă dintr-o privire.
// E un grup de tip „radio”: un singur status ales; cititoarele de ecran îl anunță ca atare.
const StatusPicker = ({ value, onChange }: { value: AppointmentStatus; onChange: (status: AppointmentStatus) => void }) => (
    <div className='flex flex-col gap-2 rounded-lg border bg-slate-50 p-3 dark:bg-slate-900'>
        <p id='status-label' className='text-sm font-medium'>Status</p>
        <div role='radiogroup' aria-labelledby='status-label' className='grid grid-cols-2 gap-2 sm:grid-cols-5'>
            {APPOINTMENT_STATUS_VALUES.map((status) => {
                const { label, className, icon: Icon, iconClassName } = APPOINTMENT_STATUS[status];
                const selected = status === value;
                return (
                    <button
                        key={status}
                        type='button'
                        role='radio'
                        aria-checked={selected}
                        onClick={() => onChange(status)}
                        className={cn(
                            'flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs transition-colors cursor-pointer',
                            'focus-visible:outline-2 focus-visible:outline-teal-500',
                            selected
                                // Ales: culorile statusului, chenar gros și text îngroșat
                                ? cn(className, 'no-underline font-semibold ring-2 ring-current shadow-sm')
                                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-700',
                        )}
                    >
                        <Icon className={cn('h-5 w-5', iconClassName)} aria-hidden />
                        {label}
                    </button>
                );
            })}
        </div>
        <p className='text-xs text-slate-500'>{APPOINTMENT_STATUS[value].label}: {APPOINTMENT_STATUS[value].description}</p>
    </div>
);

// Căutare pacient: scrii minim 2 litere, apar până la 10 rezultate, alegi unul
const PatientPicker = ({ value, onChange, onCreateNew }: {
    value: PickedPatient | null;
    onChange: (patient: PickedPatient | null) => void;
    onCreateNew: (query: string) => void;
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PickedPatient[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.trim().length < 2) return;
        // Așteptăm 250 ms după ultima tastă, ca să nu trimitem o cerere la fiecare literă.
        // `ignore` oprește un răspuns vechi să suprascrie unul mai nou.
        let ignore = false;
        const timer = setTimeout(async () => {
            setLoading(true);
            const rows = await searchPatients(query);
            if (!ignore) {
                setResults(rows);
                setLoading(false);
            }
        }, 250);
        return () => {
            ignore = true;
            clearTimeout(timer);
        };
    }, [query]);

    if (value) {
        return (
            <div className='flex items-center justify-between gap-2 rounded-md border bg-slate-50 px-3 py-2 dark:bg-slate-900'>
                <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>{value.name}</p>
                    {value.phone && <p className='text-xs text-slate-500'>{value.phone}</p>}
                </div>
                <Button type='button' variant='ghost' size='icon-sm' className='cursor-pointer' aria-label='Schimbă pacientul' onClick={() => onChange(null)}>
                    <X />
                </Button>
            </div>
        );
    }

    // Sub 2 litere nu căutăm și nu arătăm rezultate (nici unele rămase de la o căutare veche)
    const searching = query.trim().length >= 2;
    return (
        <div className='flex flex-col gap-1'>
            <div className='relative'>
                <Search className='absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                <Input
                    className='pl-8'
                    placeholder='Caută după nume, telefon sau IDNP'
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    autoComplete='off'
                />
                {searching && loading && <Loader2 className='absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400' />}
            </div>
            {searching && !loading && (
                results.length > 0 ? (
                    <ul className='max-h-48 overflow-y-auto rounded-md border divide-y'>
                        {results.map((result) => (
                            <li key={result.id}>
                                <button
                                    type='button'
                                    className='flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-900'
                                    onClick={() => {
                                        onChange(result);
                                        setQuery('');
                                        setResults([]);
                                    }}
                                >
                                    <span className='truncate font-medium'>{result.name}</span>
                                    <span className='shrink-0 text-xs text-slate-500'>{result.phone}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className='px-1 text-sm text-slate-500'>Niciun pacient activ găsit.</p>
                )
            )}
            <Button type='button' variant='outline' size='sm' className='w-fit cursor-pointer gap-1.5' onClick={() => onCreateNew(query)}>
                <UserPlus className='h-3.5 w-3.5' /> Pacient nou
            </Button>
        </div>
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
