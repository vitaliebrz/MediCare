'use server';

import { and, count, desc, eq, getTableColumns, sql, type SQL } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { patients, treatments } from '@/lib/db/schema';
import { patientSearchCondition } from '@/lib/db/patient-search';
import { nextRecordNumber } from '@/lib/db/patient-record';
import { patientSchema, type PatientFormData } from '@/lib/validations/patient';
import { getCurrentUser } from '@/lib/auth/current-user';

// Într-un fișier 'use server' se pot exporta doar funcții async, deci constanta rămâne locală
const PATIENTS_PER_PAGE = 20;

// Id-ul pacientului din rândul curent, pentru subinterogările pe treatments.
// Scris explicit cu numele tabelului: într-un select pe un singur tabel, Drizzle scrie ${patients.id} doar ca "id",
// iar în subinterogare "id" ar însemna id-ul TRATAMENTULUI (t.patient_id = t.id -> niciun rezultat).
const PATIENT_ID = sql.raw('"patients"."id"');

export type PatientStatusFilter = 'activ' | 'inactiv' | 'toate';

interface GetPatientsParams {
    q?: string;
    status?: PatientStatusFilter;
    page?: number;
    // Totalurile financiare pentru TOȚI pacienții din filtru, nu doar pagina curentă (lista de fișe medicale)
    withTotals?: boolean;
}

export async function getPatients({ q = '', status = 'activ', page = 1, withTotals = false }: GetPatientsParams = {}) {
    const { clinicId } = await getCurrentUser();

    // Condițiile se adună într-o listă, apoi se combină cu AND
    const conditions: SQL[] = [eq(patients.clinicId, clinicId)];

    if (status !== 'toate') {
        conditions.push(eq(patients.status, status));
    }

    const search = q.trim();
    if (search) {
        conditions.push(patientSearchCondition(search));
    }

    const where = and(...conditions);

    const selectRows = (pageNumber: number) => db
        .select({
            ...getTableColumns(patients),
            // Pentru lista de fișe medicale: ultimul tratament și câte tratamente are pacientul
            lastTreatmentOn: sql<string | null>`(select max(t.performed_at)::text from treatments t where t.patient_id = ${PATIENT_ID})`,
            treatmentCount: sql<number>`(select count(*)::int from treatments t where t.patient_id = ${PATIENT_ID})`,
            // Costul tuturor tratamentelor și cât s-a achitat din el; datoria = cost − achitat
            totalCost: sql<number>`(select coalesce(sum(t.price), 0)::float8 from treatments t where t.patient_id = ${PATIENT_ID})`,
            totalPaid: sql<number>`(select coalesce(sum(t.price) filter (where t.paid), 0)::float8 from treatments t where t.patient_id = ${PATIENT_ID})`,
        })
        .from(patients)
        .where(where)
        .orderBy(desc(patients.createdAt))
        .limit(PATIENTS_PER_PAGE)
        .offset((pageNumber - 1) * PATIENTS_PER_PAGE);

    // Numărarea, rândurile paginii cerute și totalurile pornesc împreună (înainte: una după alta).
    // Totalurile au aceeași condiție (căutare + status) ca lista, dar fără paginare.
    const requestedPage = Math.max(1, page);
    const [[{ total }], requestedRows, [totals]] = await Promise.all([
        db.select({ total: count() }).from(patients).where(where),
        selectRows(requestedPage),
        withTotals
            ? db.select({
                cost: sql<number>`coalesce(sum(${treatments.price}), 0)::float8`,
                paid: sql<number>`coalesce(sum(${treatments.price}) filter (where ${treatments.paid}), 0)::float8`,
            })
                .from(treatments)
                .innerJoin(patients, eq(treatments.patientId, patients.id))
                .where(where)
            : Promise.resolve([null]),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / PATIENTS_PER_PAGE));
    const currentPage = Math.min(requestedPage, totalPages);
    // Pagina cerută nu există (ex. ?page=99 din URL): luăm ultima pagină reală (caz rar, o cerere în plus)
    const rows = currentPage === requestedPage ? requestedRows : await selectRows(currentPage);

    return {
        patients: rows,
        total,
        totalPages,
        page: currentPage,
        totals: totals ? { cost: totals.cost, paid: totals.paid, debt: totals.cost - totals.paid } : null,
    };
}

// Formularul trimite '' pentru câmpurile goale; în baza de date le salvăm ca NULL
function toDbValues(data: PatientFormData) {
    const emptyToNull = <T>(value: T | '' | undefined) => (value === '' || value === undefined ? null : value);
    return {
        ...data,
        email: emptyToNull(data.email),
        birthDate: emptyToNull(data.birthDate),
        gender: emptyToNull(data.gender),
        address: emptyToNull(data.address),
        bloodType: emptyToNull(data.bloodType),
        alergie: emptyToNull(data.alergie),
        chronicDiseases: emptyToNull(data.chronicDiseases),
        currentMedications: emptyToNull(data.currentMedications),
        notes: emptyToNull(data.notes),
    };
}

// Postgres întoarce codul 23505 când e încălcat un index unic (aici: IDNP duplicat în clinică).
// Drizzle învelește eroarea originală în `cause`.
// Pacienții au două indexuri unice (IDNP și numărul fișei), deci verificăm și numele indexului
type PgError = { code?: string; constraint_name?: string };
function uniqueViolation(error: unknown): PgError | null {
    const pgError = (error as { cause?: PgError })?.cause ?? (error as PgError);
    return pgError?.code === '23505' ? pgError : null;
}
const isDuplicateIdnpError = (error: unknown) =>
    uniqueViolation(error)?.constraint_name === 'patients_clinic_id_idnp_unique';
const isDuplicateRecordNumberError = (error: unknown) =>
    uniqueViolation(error)?.constraint_name === 'patients_clinic_id_record_number_unique';

const DUPLICATE_IDNP = 'Există deja un pacient cu acest IDNP în clinica ta.';
const INVALID_DATA = 'Datele introduse nu sunt valide. Verificați câmpurile completate.';

export async function createPatient(data: PatientFormData) {
    const { id: userId, clinicId } = await getCurrentUser();
    const result = patientSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: INVALID_DATA };
    }

    const insert = () => db.insert(patients).values({
        ...toDbValues(result.data),
        clinicId,
        createdBy: userId,
        recordNumber: nextRecordNumber(clinicId),
    });
    try {
        try {
            await insert();
        } catch (error) {
            // Alt pacient a primit același număr de fișă în același moment -> mai încercăm o dată
            if (!isDuplicateRecordNumberError(error)) throw error;
            await insert();
        }
    } catch (error) {
        if (isDuplicateIdnpError(error)) {
            return { success: false, error: DUPLICATE_IDNP };
        }
        return { success: false, error: 'Pacientul nu a putut fi salvat. Încearcă din nou.' };
    }

    revalidatePath('/pacienti');
    return { success: true };
}

export async function updatePatient(id: string, data: PatientFormData) {
    const { clinicId } = await getCurrentUser();
    const result = patientSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: INVALID_DATA };
    }

    try {
        await db
            .update(patients)
            .set({ ...toDbValues(result.data), updatedAt: new Date() })
            .where(and(eq(patients.id, id), eq(patients.clinicId, clinicId)));
    } catch (error) {
        if (isDuplicateIdnpError(error)) {
            return { success: false, error: DUPLICATE_IDNP };
        }
        return { success: false, error: 'Modificările nu au putut fi salvate. Încearcă din nou.' };
    }

    revalidatePath('/pacienti');
    revalidatePath(`/pacienti/${id}`); // fișa pacientului (ex. dispare bannerul „Date incomplete”)
    return { success: true };
}

// Arhivare (inactiv) / reactivare (activ) - datele pacientului rămân
export async function setPatientStatus(id: string, status: 'activ' | 'inactiv') {
    const { clinicId } = await getCurrentUser();
    try {
        await db
            .update(patients)
            .set({ status, updatedAt: new Date() })
            .where(and(eq(patients.id, id), eq(patients.clinicId, clinicId)));
    } catch {
        return { success: false, error: 'Statusul nu a putut fi schimbat.' };
    }
    revalidatePath('/pacienti');
    return { success: true };
}

// Ștergere definitivă: tratamentele și starea dinților se șterg automat (onDelete: 'cascade')
export async function deletePatient(id: string) {
    const { clinicId } = await getCurrentUser();
    try {
        await db.delete(patients).where(and(eq(patients.id, id), eq(patients.clinicId, clinicId)));
    } catch {
        return { success: false, error: 'Pacientul nu a putut fi șters.' };
    }
    revalidatePath('/pacienti');
    return { success: true };
}
