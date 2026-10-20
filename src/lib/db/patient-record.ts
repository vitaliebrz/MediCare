import { sql } from 'drizzle-orm';

// Numărul următoarei fișe medicale (Formular 043/e) în clinică: cel mai mare număr + 1.
// Se calculează în aceeași comandă INSERT, deci nu e nevoie de o interogare separată.
// Indexul unic (clinic_id, record_number) oprește două fișe cu același număr dacă doi utilizatori
// adaugă pacienți exact în același moment (atunci a doua salvare dă eroare și se reîncearcă).
// Fișierul NU are 'use server' (exportă o funcție obișnuită, nu o acțiune).
export const nextRecordNumber = (clinicId: string) =>
    sql<number>`(select coalesce(max(record_number), 0) + 1 from patients where clinic_id = ${clinicId})`;
