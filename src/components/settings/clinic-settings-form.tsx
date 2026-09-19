'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clinicSettingsSchema, type ClinicSettingsFormData } from '@/lib/validations/clinic-settings';
import { updateClinicSettings } from '@/lib/actions/clinic-settings';

import { Card, CardContent} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { ClinicSettings } from '@/lib/db/schema';
import { Check } from 'lucide-react';

interface ClinicSettingsFormProps {
    initialData: ClinicSettings | null;
}

export const ClinicSettingsForm = ({ initialData }: ClinicSettingsFormProps) => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(clinicSettingsSchema),
        defaultValues: {
            clinicName: initialData ? initialData.clinicName : '',
            address: initialData ? initialData.address ?? '' : '',
            phone: initialData ? initialData.phone ?? '' : '',
            email: initialData ? initialData.email ?? '' : '',
            logoUrl: initialData ? initialData.logoUrl ?? '' : '',
            workingHours: initialData ? initialData.workingHours ?? '' : '',
            currency: initialData ? initialData.currency : 'MDL',

        }
    })
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const id = initialData ? initialData.id ?? '' : '';

    const onSubmit = async (data: ClinicSettingsFormData) => {
        setLoading(true);
        setErrorMessage('');
        const result = await updateClinicSettings(id, data);
        if (result.success) {
            setSuccess(true);
        } else {
            setErrorMessage(result.error ?? '');
        }
        setLoading(false);
    }
    return (
        <div>
            <Card className='max-w-xl'>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}
                    className='flex flex-col gap-4 p-2 '>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='clinicName' className='text-zinc-500'>
                                Denumirea clinicii
                            </Label>
                            <Input
                                placeholder='MediCare'
                                id='clinicName'
                                type='text'
                                {...register('clinicName')}
                            ></Input>
                            {errors.clinicName && (
                                <p className="text-sm text-red-600">{errors.clinicName.message}</p>
                            )}
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='address' className='text-zinc-500'>
                                Adresă
                            </Label>
                            <Input
                                type='text'
                                placeholder='Chișinău, str. Ștefan cel Mare 42'
                                id='address'
                                {...register('address')}
                            ></Input>
                            {
                                errors.address && (
                                    <p className="text-sm text-red-600">{errors.address.message}</p>
                                )
                            }
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='phone' className='text-zinc-500'> Telefon</Label>
                            <Input type='text'
                                placeholder='+373 XX XXX XXX'
                                id='phone'
                                {...register('phone')}
                            ></Input>
                            {errors.phone && (
                                <p className="text-sm text-red-600">{errors.phone.message}</p>
                            )}
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='email' className='text-zinc-500'>Email</Label>
                            <Input
                                type='email'
                                placeholder='example@mail.com'
                                id='email'
                                {...register('email')}
                            ></Input>
                            {errors.email && (
                                <p className="text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='logoUrl' className='text-zinc-500'>Logo clinică</Label>
                            <Input
                                type='url'
                                placeholder='image'
                                id='logoUrl'
                                {...register('logoUrl')}></Input>
                            {errors.logoUrl && (
                                <p className="text-sm text-red-600">{errors.logoUrl.message}</p>
                            )}
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='workingHours' className='text-zinc-500'>Program de lucru</Label>
                            <p>Luni- Vineri</p>
                            <Input type='text'
                                id='workingHours'
                                placeholder='08:00 - 18:00'
                                {...register('workingHours')}></Input>
                            {errors.workingHours && (
                                <p className="text-sm text-red-600">{errors.workingHours.message}</p>
                            )}
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='currency' className='text-zinc-500'>Valuta</Label>
                            <Input type='text'
                                id='currency'
                                placeholder='MDL'
                                {...register('currency')}></Input>
                            {errors.currency && (
                                <p className="text-sm text-red-600">{errors.currency.message}</p>
                            )}
                        </div>
                        {errorMessage && (
                            <p>{errorMessage}</p>
                        )}
                        <Button type='submit'
                            disabled={loading}
                        className='self-end  bg-teal-500 hover:bg-teal-600 cursor-pointer '>
                            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            {success ? <>Salvat  <Check /></>  : 'Salvează modificările'}</Button>

                    </form>

                </CardContent>

            </Card>
        </div>
    )
}