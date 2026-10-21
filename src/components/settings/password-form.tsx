'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { changePassword } from '@/lib/actions/account';
import { PRIMARY_BUTTON_CLASS } from '@/lib/ui-classes';
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/validations/account';

const FIELDS: { name: keyof ChangePasswordFormData; label: string; autoComplete: string }[] = [
    { name: 'currentPassword', label: 'Parola curentă', autoComplete: 'current-password' },
    { name: 'password', label: 'Parola nouă', autoComplete: 'new-password' },
    { name: 'confirmPassword', label: 'Confirmă parola nouă', autoComplete: 'new-password' },
];

export const PasswordForm = () => {
    const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
    });

    const onSubmit = async (data: ChangePasswordFormData) => {
        try {
            const result = await changePassword(data);
            if (!result.success) {
                // Eroarea apare sub câmpul vinovat (ex. „Parola curentă nu este corectă” sub parola curentă)
                setError(result.field ?? 'root', { message: result.error });
                return;
            }
            reset(); // golim câmpurile: parolele nu rămân pe ecran
            toast.add({ title: 'Parola a fost schimbată', description: 'Data viitoare intri cu parola nouă.', type: 'success' });
        } catch {
            setError('root', { message: 'Eroare de conexiune. Verifică internetul și încearcă din nou.' });
        }
    };

    return (
        <Card>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 p-2'>
                    <div>
                        <h2 className='text-lg font-semibold'>Schimbă parola</h2>
                        <p className='text-sm text-slate-500'>Cel puțin 8 caractere. Ca măsură de siguranță, cerem și parola curentă.</p>
                    </div>
                    {FIELDS.map((field) => (
                        <div key={field.name} className='flex flex-col gap-2'>
                            <Label htmlFor={field.name} className='text-zinc-500'>{field.label}</Label>
                            <Input
                                id={field.name}
                                type='password'
                                autoComplete={field.autoComplete}
                                placeholder='••••••••'
                                disabled={isSubmitting}
                                {...register(field.name)}
                            />
                            {errors[field.name] && <p className='text-sm text-red-600'>{errors[field.name]?.message}</p>}
                        </div>
                    ))}
                    {errors.root && <p className='text-sm text-red-600'>{errors.root.message}</p>}
                    <Button type='submit' disabled={isSubmitting} className={`self-end ${PRIMARY_BUTTON_CLASS}`}>
                        {isSubmitting && <Loader2 className='h-4 w-4 animate-spin' />}
                        Schimbă parola
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
