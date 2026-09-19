'use client'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { doctorsSchema, type DoctorFormData } from '@/lib/validations/doctors';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from '@/components/ui/select';
import { Controller } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Check } from 'lucide-react';
import { createDoctor, updateDoctor } from '@/lib/actions/doctors';
import type { Category, Doctors } from '@/lib/db/schema';
import { doctorColor } from '@/lib/constants/doctor-colors';
import { useEffect } from 'react';


interface DoctorFormProps {
    trigger: React.ReactElement;
    initialData?: Doctors;
    categories: Category[];
}
export const DoctorForm = ({ trigger, initialData, categories }: DoctorFormProps) => {
    const { register, watch, control, reset, handleSubmit, formState: { errors } } = useForm<DoctorFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(doctorsSchema) as any,
        defaultValues: {
            firstName: initialData ? initialData.firstName : '',
            lastName: initialData ? initialData.lastName : '',
            categoryId: initialData ? initialData.categoryId : '',
            phone: initialData ? initialData.phone ?? '' : '',
            email: initialData ? initialData.email ?? '' : '',
            hireDate: initialData ? initialData.hireDate ?? undefined : '',
            active: initialData ? initialData.active : true,
            color: initialData ? initialData.color : 'teal'
        }
    })
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [open, setOpen] = useState(false);

    const onSubmit = async (data: DoctorFormData) => {
        setLoading(true);
        setErrorMessage('');
        try {
            let result;
            if (initialData) {
                result = await updateDoctor(initialData.id, data);
            } else {
                result = await createDoctor(data)
            }
            if (result.success) {
                setSuccess(true);
                reset();
                setTimeout(() => {
                    setOpen(false);
                    setSuccess(false);
                }, 300)
            } else {
                setErrorMessage(result.error ?? '')
            }
        } catch {
            setErrorMessage('A aparut o eroare, încearcă mai târziu')
        } finally {
            setLoading(false);

        }
    }

    const isEmptyField = ({ firstName, lastName, categoryId }: { firstName: string, lastName: string, categoryId: string }) => {
        if (firstName.trim() === "" || lastName.trim() === "" || categoryId.trim() === "") {
            return false;
        } else {
            return true
        }
    }
    useEffect(() => {
        if (initialData) {
            reset({
                firstName: initialData.firstName,
                lastName: initialData.lastName,
                categoryId: initialData.categoryId,
                phone: initialData.phone ?? '',
                email: initialData.email ?? '',
                hireDate: initialData.hireDate ?? '',
                active: initialData.active,
                color: initialData.color,
            })
        }
    }, [initialData, reset]);
    return (

        <div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger render={trigger} />
                <DialogContent className='sm:max-w-lg'>
                    <DialogHeader>
                        <DialogTitle>{initialData ? 'Editează medic' : 'Medic nou'}</DialogTitle>
                        <DialogDescription>{initialData ? `Dr. ${initialData.firstName} ${initialData.lastName}` : 'Adaugă un medic în echipa clinicii'}</DialogDescription>
                    </DialogHeader>
                    <hr />
                    <form onSubmit={handleSubmit(onSubmit)}
                        className='flex flex-col gap-4'>
                        <div className='flex justify-between gap-4'>
                            <div className='flex flex-col gap-2 flex-1/2'>
                                <Label htmlFor='firstName'>Prenumele<span className='text-red-500'>*</span></Label>
                                <Input
                                    type='text'
                                    id='firstName'
                                    {...register('firstName')}
                                    placeholder='Ion'
                                ></Input>
                                {errors.firstName && (
                                    <p className='text-sm text-red-600'>{errors.firstName.message}</p>
                                )}
                            </div>

                            <div className='flex flex-col gap-2 flex-1/2'>
                                <Label htmlFor='lastName'>Nume<span className='text-red-500'>*</span></Label>
                                <Input
                                    type='text'
                                    id='lastName'
                                    {...register('lastName')}
                                    placeholder='Popescu'
                                ></Input>
                                {errors.lastName && (
                                    <p className='text-sm text-red-600'>{errors.lastName.message}</p>
                                )}
                            </div>
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='categoryId'>Specializare<span className='text-red-500'>*</span></Label>
                            <Controller
                                name='categoryId'
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className='w-full cursor-pointer'>
                                            <SelectValue placeholder='Alege o specializare' >
                                                {categories.find((cat) => cat.id === field.value)?.name}
                                            </SelectValue >
                                        </SelectTrigger>
                                        <SelectContent className='p-2 w-fit'>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                )} />
                            {errors.categoryId && (
                                <p className='text-sm text-red-600'>{errors.categoryId.message}</p>
                            )}
                        </div>
                        <div className='flex justify-between gap-4'>
                            <div className='flex flex-col gap-2 flex-1/2'>
                                <Label htmlFor='phone'>Telefon</Label>
                                <Controller
                                    name='phone'
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id='phone'
                                            type='tel'
                                            inputMode='tel'
                                            placeholder='+37369000000'
                                            value={field.value ?? ''}
                                            onChange={(e) =>
                                                field.onChange(e.target.value.replace(/[^+0-9]/g, ''))}
                                            onBlur={field.onBlur}
                                            ref={ field.ref} />
                                    )} />
                                
                                {errors.phone && (
                                    <p className='text-sm text-red-600'>{errors.phone.message}</p>
                                )}
                            </div>
                            <div className='flex flex-col gap-2 flex-1/2'>
                                <Label htmlFor='hireDate'>An angajare</Label>
                                <Input type='date'
                                    id='hireDate'
                                    {...register('hireDate')
                                    }></Input>
                            </div>
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='email'>Email</Label>
                            <Input
                                type='email'
                                id='email'
                                {...register('email')}
                                placeholder='example@mail.com'
                            ></Input>
                            {errors.email && (
                                <p className='text-sm text-red-600'>{errors.email.message}</p>
                            )}
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='color'>Culoare în calendar</Label>
                            <Controller
                                name='color'
                                control={control}
                                render={({ field }) => (
                                    <div className='flex gap-3'>
                                        {doctorColor.map((culoare) => (
                                            <button
                                                key={culoare.value}
                                                type="button"
                                                onClick={() => field.onChange(culoare.value)}
                                                className={`h-8 w-8 rounded-full cursor-pointer
                                                    ${field.value === culoare.value ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                                                style={{ backgroundColor: culoare.hex }}
                                            />
                                        ))}
                                    </div>
                                )} />
                        </div>
                        <div className='flex  items-center justify-between'>
                            <div>
                                <Label htmlFor='active'>Medic activ</Label>
                                <span className='text-zinc-500'>Medicii inactivi nu apar în programări</span>
                            </div>
                            <Controller
                                name='active'
                                control={control}
                                render={({ field }) => (
                                    <Switch
                                        id='active'
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className='data-checked:bg-teal-500' />
                                )} />
                        </div>
                        <hr />
                        {errorMessage && (
                            <p className='text-sm text-red-600'>{errorMessage}</p>
                        )}
                        <Button type='submit' disabled={loading || !isEmptyField({ firstName: watch('firstName') ?? '', lastName: watch('lastName') ?? '', categoryId: watch('categoryId') ?? '' })} className={`bg-teal-500 hover:bg-teal-600 cursor-pointer ${isEmptyField({ firstName: watch('firstName') ?? '', lastName: watch('lastName') ?? '', categoryId: watch('categoryId') ?? '' }) ? '' : 'cursor-not-allowed'} `} >
                            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            {success ? (
                                <>Salvat<Check className='ml-2 h-4 w-4' /> </>
                            ) : initialData ? ('Salvează modificările') : ('Adaugă medic')}

                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

