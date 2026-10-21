'use client';

import { use, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, setRememberMePreference } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox"
import { AuthShell } from '@/components/auth/auth-shell';

const subscribeNoop = () => () => {};

export default function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ reset?: string }>;
}) {
    const router = useRouter();
    // ?reset=success vine de la /reset-password după ce parola a fost schimbată
    const passwordReset = use(searchParams).reset === 'success';


    const {
        rememberMe,
        lastLoginEmail,
        setRememberMe,
        setLastLogin
    } = useAuthStore();

    // null = utilizatorul n-a scris nimic, deci afișăm emailul salvat (dacă există)
    const [typedEmail, setEmail] = useState<string | null>(null);
    const email = typedEmail ?? (rememberMe && lastLoginEmail ? lastLoginEmail : '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // false pe server și la hidratare, true după ce pagina rulează în browser
    const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);


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
        <AuthShell>
                    <Card className='shadow-xl '>
                        <CardHeader className='space-y-1 mb-5'>
                            <CardTitle className='text-2xl'> Bun venit înapoi! </CardTitle>
                            <CardDescription>
                                Autentifică-te în contul tău
                            </CardDescription>

                        </CardHeader>
                        <CardContent>
                            {passwordReset && (
                                <div className='mb-4 rounded-md bg-teal-50 p-3 text-sm text-teal-800 border border-teal-200'>
                                    Parola a fost schimbată. Autentifică-te cu parola nouă.
                                </div>
                            )}
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


                                    <Link href='/forgot-password' className='text-sm font-medium text-teal-500 hover:text-teal-600'>Am uitat parola</Link>

                                </div>


                                {error && (
                                    <div className='rounded-md bg-red-50 dark:bg-red-950/50 p-3 text-sm text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900'>{error}</div>
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
                            <p className='mt-6 text-center text-sm text-slate-500'>
                                Clinica ta nu are cont?{' '}
                                <Link href='/register' className='font-medium text-teal-500 hover:text-teal-600'>Creează unul</Link>
                            </p>
                        </CardContent>
                    </Card>
        </AuthShell>
    );
}
