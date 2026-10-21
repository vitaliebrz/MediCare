import type { User } from '@/lib/db/schema';

// Rolul utilizatorului, cum apare în meniu și în Setări → Cont
export const ROLE_LABELS: Record<User['role'], string> = {
    admin: 'Administrator',
    medic: 'Medic',
    asistent: 'Asistent',
};
