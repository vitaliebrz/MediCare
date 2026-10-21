'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    // ?error=link-invalid vine de la /auth/confirm când linkul din email a expirat
    const linkInvalid = use(searchParams).error === 'link-invalid';

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });
    const [sent, setSent] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const onSubmit = async ({ email }: ForgotPasswordFormData) => {
        setErrorMessage('');
        const supabase = createClient();
        // După ce utilizatorul apasă linkul din email, Supabase îl trimite aici cu ?code=...
        // Adresa trebuie să fie în Supabase → Authentication → URL Configuration → Redirect URLs
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/auth/confirm`,
        });

        // Prea multe cereri într-un timp scurt
        if (error?.status === 429) {
            setErrorMessage('Ai cerut prea multe linkuri. Încearcă din nou peste câteva minute.');
            return;
        }
        // Pentru orice alt caz arătăm același mesaj, ca să nu dezvăluim ce emailuri au cont
        setSent(true);
    };

    return (
        <AuthShell>
            <Card className='shadow-xl'>
                <CardHeader className='space-y-1 mb-5'>
                    <CardTitle className='text-2xl'>Ai uitat parola?</CardTitle>
                    <CardDescription>
                        Introdu emailul contului și îți trimitem un link pentru a seta o parolă nouă.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sent ? (
                        <div className='flex gap-3 rounded-md bg-teal-50 p-3 text-sm text-teal-800 border border-teal-200'>
                            <MailCheck className='h-5 w-5 shrink-0' />
                            <p>Dacă există un cont cu acest email, vei primi în câteva minute un link pentru resetarea parolei. Verifică și folderul Spam.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                            {linkInvalid && (
                                <div className='rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200'>
                                    Linkul a expirat, a fost deja folosit sau a fost deschis în alt browser. Cere unul nou.
                                </div>
                            )}
                            <div className='space-y-2'>
                                <Label htmlFor='email'>Email</Label>
                                <Input
                                    id='email'
                                    type='email'
                                    placeholder='doctor@email.com'
                                    autoComplete='email'
                                    disabled={isSubmitting}
                                    {...register('email')}
                                />
                                {errors.email && (
                                    <p className='text-sm text-red-600'>{errors.email.message}</p>
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
                                {isSubmitting ? 'Se trimite...' : 'Trimite linkul'}
                            </Button>
                        </form>
                    )}
                    <Link href='/login' className='mt-6 flex items-center justify-center gap-1 text-sm text-teal-500 hover:text-teal-600'>
                        <ArrowLeft className='h-4 w-4' />
                        Înapoi la autentificare
                    </Link>
                </CardContent>
            </Card>
        </AuthShell>
    );
}
