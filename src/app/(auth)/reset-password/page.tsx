'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Aici se ajunge doar prin linkul din email: /auth/confirm a creat deja o sesiune temporară
export default function ResetPasswordPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });
    const [errorMessage, setErrorMessage] = useState('');

    const onSubmit = async ({ password }: ResetPasswordFormData) => {
        setErrorMessage('');
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setErrorMessage(
                error.code === 'same_password'
                    ? 'Parola nouă trebuie să fie diferită de cea veche.'
                    : 'Nu am putut schimba parola. Cere un link nou și încearcă din nou.'
            );
            return;
        }

        // Închidem sesiunea temporară, ca utilizatorul să intre cu parola nouă
        await supabase.auth.signOut();
        router.push('/login?reset=success');
        router.refresh();
    };

    return (
        <AuthShell>
            <Card className='shadow-xl'>
                <CardHeader className='space-y-1 mb-5'>
                    <CardTitle className='text-2xl'>Setează o parolă nouă</CardTitle>
                    <CardDescription>
                        Alege o parolă de cel puțin 8 caractere.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='password'>Parola nouă</Label>
                            <Input
                                id='password'
                                type='password'
                                placeholder='••••••••'
                                autoComplete='new-password'
                                disabled={isSubmitting}
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className='text-sm text-red-600'>{errors.password.message}</p>
                            )}
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='confirmPassword'>Confirmă parola</Label>
                            <Input
                                id='confirmPassword'
                                type='password'
                                placeholder='••••••••'
                                autoComplete='new-password'
                                disabled={isSubmitting}
                                {...register('confirmPassword')}
                            />
                            {errors.confirmPassword && (
                                <p className='text-sm text-red-600'>{errors.confirmPassword.message}</p>
                            )}
                        </div>
                        {errorMessage && (
                            <div className='rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200'>{errorMessage}</div>
                        )}
                        <Button
                            type='submit'
                            className='w-full bg-teal-500 hover:bg-teal-600'
                            disabled={isSubmitting}
                            size='lg'>
                            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            {isSubmitting ? 'Se salvează...' : 'Salvează parola'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </AuthShell>
    );
}
