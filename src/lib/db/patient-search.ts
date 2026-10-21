import { ilike, or, sql, type SQL } from 'drizzle-orm';
import { patients } from '@/lib/db/schema';

// Condiția de căutare a unui pacient după nume, telefon sau IDNP.
// Folosită în lista de pacienți și în căutarea din formularul de programare.
// Fișierul NU are 'use server' (exportă o funcție obișnuită, nu o acțiune).
export function patientSearchCondition(q: string): SQL {
    // % și _ au sens special în LIKE; le "escapăm" ca să fie căutate ca text obișnuit
    const term = `%${q.trim().replace(/[\\%_]/g, '\\$&')}%`;
    return or(
        ilike(patients.firstName, term),
        ilike(patients.lastName, term),
        ilike(patients.phone, term),
        ilike(patients.idnp, term),
        // ca să meargă și "Popescu Ion" sau "Ion Popescu"
        sql`${patients.lastName} || ' ' || ${patients.firstName} ilike ${term}`,
        sql`${patients.firstName} || ' ' || ${patients.lastName} ilike ${term}`,
    )!;
}
