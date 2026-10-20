import { z } from 'zod';
import { patientSchema } from '@/lib/validations/patient';

export const APPOINTMENT_STATUS_VALUES = ['programat', 'confirmat', 'finalizat', 'anulat', 'neprezentat'] as const;

// Pacient nou creat direct din programare: doar datele minime, cu aceleași reguli ca în fișa pacientului.
// Restul (IDNP, data nașterii etc.) se completează ulterior din fișa pacientului.
export const quickPatientSchema = patientSchema.pick({ lastName: true, firstName: true, phone: true });
export type QuickPatientData = z.infer<typeof quickPatientSchema>;

// Durata NU e în formular: serverul o copiază din serviciul ales (Setări → Servicii)
const appointmentFields = z.object({
    // Ori un pacient existent (patientId), ori unul nou (newPatient) — nu amândouă
    patientId: z.uuid().or(z.literal('')),
    newPatient: quickPatientSchema.nullable(),
    serviceId: z.uuid('Alege procedura'),
    // în selector, "fără medic" trimite ''
    doctorId: z.uuid().optional().or(z.literal('')),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Alege data'),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Alege ora'),
    reason: z.string().trim().optional().or(z.literal('')),
    notes: z.string().trim().optional().or(z.literal('')),
    status: z.enum(APPOINTMENT_STATUS_VALUES),
});

export const appointmentSchema = appointmentFields.refine((data) => (data.patientId === '') !== (data.newPatient === null), {
    message: 'Alege pacientul sau adaugă unul nou',
    path: ['patientId'],
    // Implicit, refine-ul nu rulează cât timp ALTE câmpuri au erori (ex. procedura nealeasă).
    // Cu `when` rulează imediat ce câmpurile pacientului sunt valide, ca eroarea să apară de la primul click.
    when: (payload) => appointmentFields.pick({ patientId: true, newPatient: true }).safeParse(payload.value).success,
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;
