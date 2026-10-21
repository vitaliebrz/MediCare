'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { updateProfile } from '@/lib/actions/account';
import { PRIMARY_BUTTON_CLASS, pillClass } from '@/lib/ui-classes';
import { profileSchema, type ProfileFormData } from '@/lib/validations/account';

interface ProfileFormProps {
    initialData: ProfileFormData;
    email: string;
    roleLabel: string;
    clinicName: string;
}

// Profilul utilizatorului logat: numele și telefonul se pot schimba; emailul, rolul și clinica doar se văd
export const ProfileForm = ({ initialData, email, roleLabel, clinicName }: ProfileFormProps) => {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: initialData,
    });
    const [errorMessage, setErrorMessage] = useState('');

    const onSubmit = async (data: ProfileFormData) => {
        setErrorMessage('');
        try {
            const result = await updateProfile(data);
            if (!result.success) {
                setErrorMessage(result.error ?? '');
                return;
            }
            reset(data);
            toast.add({ title: 'Profil salvat', type: 'success' });
        } catch {
            setErrorMessage('Eroare de conexiune. Verifică internetul și încearcă din nou.');
        }
    };

    return (
        <Card>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 p-2'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                        <h2 className='text-lg font-semibold'>Profil</h2>
                        <span className={pillClass('teal')}>{roleLabel}</span>
                    </div>

                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='fullName' className='text-zinc-500'>Nume complet</Label>
                        <Input id='fullName' autoComplete='name' {...register('fullName')} />
                        {errors.fullName && <p className='text-sm text-red-600'>{errors.fullName.message}</p>}
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='phone' className='text-zinc-500'>Telefon</Label>
                        <Input id='phone' type='tel' autoComplete='tel' placeholder='+373 XX XXX XXX' {...register('phone')} />
                        {errors.phone && <p className='text-sm text-red-600'>{errors.phone.message}</p>}
                    </div>

                    {/* Doar afișate: emailul e și numele de login, se schimbă doar prin administrator */}
                    <dl className='grid gap-3 rounded-md bg-slate-50 p-3 text-sm sm:grid-cols-2'>
                        <div>
                            <dt className='text-xs text-slate-500'>Email (login)</dt>
                            <dd className='break-all'>{email}</dd>
                        </div>
                        <div>
                            <dt className='text-xs text-slate-500'>Clinica</dt>
                            <dd>{clinicName}</dd>
                        </div>
                        <p className='text-xs text-slate-500 sm:col-span-2'>Emailul se schimbă doar prin administrator.</p>
                    </dl>

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
