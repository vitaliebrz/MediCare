'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { changeEmail } from '@/lib/actions/account';
import { PRIMARY_BUTTON_CLASS } from '@/lib/ui-classes';
import { changeEmailSchema, type ChangeEmailFormData } from '@/lib/validations/account';

// Emailul de login. Se schimbă imediat (fără email de confirmare), după verificarea parolei curente.
export const EmailForm = ({ currentEmail }: { currentEmail: string }) => {
    const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<ChangeEmailFormData>({
        resolver: zodResolver(changeEmailSchema),
        defaultValues: { email: '', currentPassword: '' },
    });

    const onSubmit = async (data: ChangeEmailFormData) => {
        try {
            const result = await changeEmail(data);
            if (!result.success) {
                setError(result.field ?? 'root', { message: result.error });
                return;
            }
            reset();
            toast.add({ title: 'Email schimbat', description: `De acum te loghezi cu ${data.email.trim().toLowerCase()}.`, type: 'success' });
        } catch {
            setError('root', { message: 'Eroare de conexiune. Verifică internetul și încearcă din nou.' });
        }
    };

    return (
        <Card>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 p-2'>
                    <div>
                        <h2 className='text-lg font-semibold'>Email de login</h2>
                        <p className='text-sm text-slate-500'>
                            Acum: <span className='font-medium text-slate-700 break-all'>{currentEmail}</span>
                        </p>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='newEmail' className='text-zinc-500'>Email nou</Label>
                        <Input id='newEmail' type='email' autoComplete='email' placeholder='nume@exemplu.com' disabled={isSubmitting} {...register('email')} />
                        {errors.email && <p className='text-sm text-red-600'>{errors.email.message}</p>}
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='emailCurrentPassword' className='text-zinc-500'>Parola curentă</Label>
                        <Input id='emailCurrentPassword' type='password' autoComplete='current-password' placeholder='••••••••' disabled={isSubmitting} {...register('currentPassword')} />
                        {errors.currentPassword && <p className='text-sm text-red-600'>{errors.currentPassword.message}</p>}
                    </div>
                    <p className='text-xs text-slate-500'>
                        Verifică adresa cu atenție: e și adresa la care primești linkul de resetare a parolei.
                    </p>
                    {errors.root && <p className='text-sm text-red-600'>{errors.root.message}</p>}
                    <Button type='submit' disabled={isSubmitting} className={`self-end ${PRIMARY_BUTTON_CLASS}`}>
                        {isSubmitting && <Loader2 className='h-4 w-4 animate-spin' />}
                        Schimbă emailul
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
