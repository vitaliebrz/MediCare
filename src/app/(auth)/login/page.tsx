'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, setRememberMePreference } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import DentalToothIcon from '@iconify-react/hugeicons/dental-tooth';
import { Checkbox } from "@/components/ui/checkbox"



export default function LoginPage() {
    const router = useRouter();


    const {
        rememberMe,
        lastLoginEmail,
        setRememberMe,
        setLastLogin
    } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (rememberMe && lastLoginEmail) {
            setEmail(lastLoginEmail);
        }
    }, [rememberMe, lastLoginEmail]);


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // Oprește refresh-ul default al formularului
        setLoading(true); // Arată spinner-ul
        setError(''); // Șterge eroarea veche (dacă era)

        try {
            // IMPORTANT: seteaaza preferința ÎNAINTE de a crea clientul
            setRememberMePreference(rememberMe);

            const supabase = createClient();
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (signInError) {
                setError('Email sau parolă incorectă');
                setLoading(false);
                return;
            }
            if (!data.session) {
                setError('Autentificare eșuată. Incărcă din nou.');
                setLoading(false);
                return;
            }
            if (rememberMe) {
                setLastLogin(email);
            }

            router.push('/');
            router.refresh();
        } catch (err) {
            console.error('Login error: ', err);
            setError('A apărutt o eroare. Încearcă din nou.');
            setLoading(false);
        }
    };
    if (!mounted) {
        return null;
    }
    return (
        <div className=' flex flex-col-reverse md:flex-row bg-linear-to-r from-white from-50% black to-50% w-full h-screen'>
            <div className='h-dvh md:w-1/2 flex justify-center items-center'>
                <div className='w-lg lg:max-w-md lg:w-1/2 px-5'>
                    <div className="mb-8">
                        <div className="flex items-center gap-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                            <div className="bg-teal-500 text-white text-lg p-2 rounded-lg">
                                <DentalToothIcon className='w-7 h-7' />
                            </div>
                            MediCare
                        </div>
                    </div>
                    <Card className='shadow-xl '>
                        <CardHeader className='space-y-1 mb-5'>
                            <CardTitle className='text-2xl'> Bun venit înapoi! </CardTitle>
                            <CardDescription>
                                Autentifică-te în contul tău
                            </CardDescription>

                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className='space-y-4'>
                                <div className='space-y-2'>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type='email'
                                        placeholder='doctor@email.com'
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                        autoComplete='email'

                                    ></Input>
                                </div>
                                <div className='space-y-2'>
                                    <Label htmlFor="password">Parolă</Label>
                                    < Input
                                        id='password'
                                        type='password'
                                        placeholder='••••••••'
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        autoComplete='current-password'
                                    />
                                </div>

                                {/* Remember Me */}
                                <div className="flex justify-between items-center  pt-1">
                                    <div className='flex gap-2'>
                                        <Checkbox
                                            id="remember"
                                            checked={rememberMe}
                                            onCheckedChange={(checked) => setRememberMe(checked === true)}
                                            disabled={loading}
                                            className="mt-0.5"
                                        />
                                        <Label
                                            htmlFor="remember"
                                            className="text-sm font-medium cursor-pointer select-none"
                                        >
                                            Ține-mă minte
                                        </Label>

                                    </div>


                                    <Button className='bg-white text-teal-500 hover:bg-white hover:cursor-pointer'>Am uitat parola</Button>

                                </div>


                                {error && (
                                    <div className='rounded-md bg-red-50 dark:bg-red950/50 p-3 text-sm text-red-800 dark: text-red-300 border border-red-200 dark:border-red-900'>{error}</div>
                                )}
                                <Button
                                    type='submit'
                                    className='w-full bg-teal-500 hover:bg-teal-600'
                                    disabled={loading}
                                    size='lg'>
                                    {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                                    {loading ? 'Se autentifică...' : 'Autentificare'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>


            </div>

            <div className='hidden md:flex flex-col items-center justify-center bg-zinc-900 h-dvh md:w-1/2 p-12'>
                <div className="w-max bg-teal-500/10 border border-teal-500/20 text-teal-500 text-lg p-2 rounded-2xl">
                    <DentalToothIcon className='h-14 w-14' />
                </div>
                <h1 className='font-semibold text-2xl mt-8 text-white'>MediCare</h1>
                <p className='text-center mt-3 text-zinc-500'>Sistem de management al clinicii dentare. <br className='hidden lg:block' /> Gestionează pacienți, programări și fișe <br className='hidden lg:block' /> medicale într-un singur loc.</p>

            </div>
        </div>


    );
}
