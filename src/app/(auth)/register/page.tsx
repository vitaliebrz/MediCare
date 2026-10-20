'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MailCheck } from 'lucide-react';
import { registerClinic } from '@/lib/actions/register';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const fields = [
    { name: 'clinicName', label: 'Numele clinicii', type: 'text', placeholder: 'Clinica Zâmbet', autoComplete: 'organization' },
    { name: 'fullName', label: 'Numele tău', type: 'text', placeholder: 'Ion Popescu', autoComplete: 'name' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'doctor@email.com', autoComplete: 'email' },
    { name: 'password', label: 'Parolă', type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
] as const;

export default function RegisterPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: { clinicName: '', fullName: '', email: '', password: '' },
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [needsConfirmation, setNeedsConfirmation] = useState(false);

    const onSubmit = async (data: RegisterFormData) => {
        setErrorMessage('');
        const result = await registerClinic(data);
        if (!result.success) {
            setErrorMessage(result.error ?? '');
            return;
        }
        if (result.needsConfirmation) {
            setNeedsConfirmation(true);
            return;
        }
        router.push('/');
        router.refresh();
    };

    return (
        <AuthShell>
            <Card className='shadow-xl'>
                <CardHeader className='space-y-1 mb-5'>
                    <CardTitle className='text-2xl'>Creează contul clinicii</CardTitle>
                    <CardDescription>
                        Vei fi administratorul clinicii și vei putea adăuga medici, servicii și pacienți.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {needsConfirmation ? (
                        <div className='flex gap-3 rounded-md bg-teal-50 p-3 text-sm text-teal-800 border border-teal-200'>
                            <MailCheck className='h-5 w-5 shrink-0' />
                            <p>Contul a fost creat. Confirmă adresa de email din mesajul primit, apoi autentifică-te.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                            {fields.map((field) => (
                                <div key={field.name} className='space-y-2'>
                                    <Label htmlFor={field.name}>{field.label}</Label>
                                    <Input
                                        id={field.name}
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        autoComplete={field.autoComplete}
                                        disabled={isSubmitting}
                                        {...register(field.name)}
                                    />
                                    {errors[field.name] && (
                                        <p className='text-sm text-red-600'>{errors[field.name]?.message}</p>
                                    )}
                                </div>
                            ))}
                            {errorMessage && (
                                <div className='rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200'>{errorMessage}</div>
                            )}
                            <Button
                                type='submit'
                                className='w-full bg-teal-500 hover:bg-teal-600'
                                disabled={isSubmitting}
                                size='lg'>
                                {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                                {isSubmitting ? 'Se creează...' : 'Creează contul'}
                            </Button>
                        </form>
                    )}
                    <p className='mt-6 text-center text-sm text-slate-500'>
                        Ai deja cont?{' '}
                        <Link href='/login' className='font-medium text-teal-500 hover:text-teal-600'>Autentifică-te</Link>
                    </p>
                </CardContent>
            </Card>
        </AuthShell>
    );
}
