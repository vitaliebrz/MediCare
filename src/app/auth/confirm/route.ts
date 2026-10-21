import type { EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Aici ajunge utilizatorul după ce apasă linkul din emailul de resetare.
// Două forme posibile ale linkului:
//   /auth/confirm?code=...                         (șablonul implicit Supabase, flux PKCE)
//   /auth/confirm?token_hash=...&type=recovery     (șablon personalizat, necesită SMTP propriu)
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;

    const supabase = await createClient();

    if (code) {
        // Schimbă codul pe o sesiune; cheia secretă (code verifier) e în cookie-ul
        // pus de browser la cererea resetării, deci merge doar în același browser
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            redirect('/reset-password');
        }
    } else if (tokenHash && type === 'recovery') {
        // Verifică tokenul și, dacă e valid, setează cookie-urile de sesiune
        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
        if (!error) {
            redirect('/reset-password');
        }
    }

    // Cod/token lipsă, expirat, deja folosit sau deschis din alt browser
    redirect('/forgot-password?error=link-invalid');
}
