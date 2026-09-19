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
import { servicesSchema, type ServicesFormData } from '@/lib/validations/services';
import type { Category, Service } from '@/lib/db/schema';

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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import { createService, updateService } from '@/lib/actions/services';
import { Loader2 } from 'lucide-react';
import { Check } from 'lucide-react';

interface ServiceFormProps {
    trigger: React.ReactElement;  // în loc de React.ReactNode\
    initialData?: Service;
    categories: Category[];
    currency: string;
}

export const ServiceForm = ({ trigger, initialData, categories, currency }: ServiceFormProps) => {
    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ServicesFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(servicesSchema) as any,
        defaultValues: {
            name: initialData ? initialData.name : '',
            category: initialData ? initialData.category ?? '': '',
            description: initialData ? initialData.description ?? '' : '',
            price: initialData ? Number(initialData.price) : 0,
            durationMinutes: initialData ? initialData.durationMinutes ?? 5 : 5,
            active: initialData ? initialData.active : true,
        },
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [open, setOpen] = useState(false);

    const onSubmit = async (data: ServicesFormData) => {
        try {
            setLoading(true);
            setErrorMessage('');
            let result;
            if (initialData) {
                result = await updateService(initialData.id, data);
            } else {
                result = await createService(data);
            }
            if (result.success) {
                setSuccess(true);
                reset();
                setTimeout(() => {
                    setOpen(false);
                    setSuccess(false);
                }, 300);
            } else {
                setErrorMessage(result.error ?? '');
            }
        } catch {
            setErrorMessage('A apărut o eroare, încearcă mai târziu')
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                category: initialData.category ?? '',
                description: initialData.description ?? '',
                price: Number(initialData.price),
                durationMinutes: initialData.durationMinutes ?? 5,
                active: initialData.active,
            })
        }
    }, [initialData, reset])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={trigger} />
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Editează serviciu' : 'Serviciu Nou'}</DialogTitle>
                    <DialogDescription>{initialData ? `${initialData.name}` : 'Adaugă un serviciu în lista clinicii'}</DialogDescription>
                </DialogHeader>
                <hr />
                <form onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-4"
                >
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='name'>Denumire serviciu<span className='text-red-500'>*</span></Label>
                        <Input type='text'
                            id='name'
                            {...register('name')}
                            placeholder='ex: Detartraj ultrasonic'
                        ></Input>
                        {errors.name && (
                            <p className="text-sm text-red-600">{errors.name.message}</p>
                        )}
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='category'>Categorie<span className='text-red-500'>*</span></Label>
                        <Controller
                            name='category'
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className='w-full cursor-pointer'>
                                        <SelectValue placeholder='Alege o categorie' />
                                    </SelectTrigger>
                                    <SelectContent className='p-2 w-fit'>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.name}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}>

                        </Controller>
                        {
                            errors.category && (
                                <p className="text-sm text-red-600">{errors.category.message}</p>
                            )
                        }
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='durationMinutes'>Durată (min)<span className='text-red-500'>*</span></Label>
                        <Input type='number'
                            id='durationMinutes'
                            step='5'
                            min='5'
                            max='480'
                            {...register('durationMinutes', { valueAsNumber: true })}></Input>
                        {errors.durationMinutes && (
                            <p className="text-sm text-red-600">{errors.durationMinutes.message}</p>
                        )}
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='price'>Preț({currency})</Label>
                        <div className='relative'>
                            <Input
                                type='number'
                                id='price'
                                step='50'
                                min='0'
                                // placeholder='0'
                                {...register('price', { valueAsNumber: true })}
                                className='pr-12'></Input>
                            <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>{currency}</span>
                        </div>
                        {errors.price && (
                            <p className="text-sm text-red-600">{errors.price.message}</p>
                        )}
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='description'>Descriere</Label>
                        <Textarea
                            id='description'
                            {...register('description')}
                            className='resize-none'
                            placeholder='Descriere scurtă a serviciului...'
                        ></Textarea>
                        {errors.description && (
                            <p className="text-sm text-red-600">{errors.description.message}</p>
                        )}
                    </div>
                    <div className='flex items-center justify-between gap-2'>
                        <div>
                            <Label htmlFor='active'>Serviciu activ</Label>
                            <span className='text-muted-foreground text-xs' >Serviciile inactive nu apar în lista de programări</span>
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
                        {errors.active && (
                            <p className="text-sm text-red-600"> {errors.active.message}</p>
                        )}
                    </div>
                    <hr />
                    {errorMessage && (
                        <p className='text-sm text-red-600'>{errorMessage}</p>
                    )}

                    <Button type='submit' disabled={loading} className='bg-teal-500 hover:bg-teal-600 cursor-pointer'>
                        {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                        {success ? (
                            <>Salvat<Check className='ml-2 h-4 w-4' /> </>
                        ) : initialData ? ('Actualizează serviciul') : ('Adaugă serviciu')}

                    </Button>
                </form>

            </DialogContent>
        </Dialog >
    );
};