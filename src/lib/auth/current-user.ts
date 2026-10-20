import { cache } from 'react';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

// Cine e logat și din ce clinică face parte.
// Folosită la începutul FIECĂREI server action / pagini care lucrează cu date.
// cache() = într-o singură cerere, interogarea rulează o singură dată, oricâte apeluri ar fi.
export const getCurrentUser = cache(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    const [profile] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    if (!profile) {
        throw new Error('Contul nu este asociat cu nicio clinică');
    }
    return profile;
});
