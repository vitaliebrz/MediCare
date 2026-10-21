import { z } from 'zod';

export const BLOOD_TYPES = ['0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;

// Data de azi în format YYYY-MM-DD (ora locală), comparabilă direct cu valoarea din <input type='date'>
const today = () => new Date().toLocaleDateString('sv-SE');

// Câmp text opțional: în formular, un câmp necompletat trimite '' (șir gol)
const optionalText = z.string().trim().optional().or(z.literal(''));

export const patientSchema = z.object({
    // Date personale
    firstName: z.string().trim().min(2, 'Prenumele trebuie să aibă minim 2 caractere'),
    lastName: z.string().trim().min(2, 'Numele trebuie să aibă minim 2 caractere'),
    idnp: z.string().trim().regex(/^\d{13}$/, 'IDNP-ul trebuie să aibă exact 13 cifre'),
    phone: z.string().trim().regex(/^\+?[0-9]{8,15}$/, 'Numărul de telefon trebuie să aibă 8-15 cifre, opțional cu + la început'),
    email: z.email('Email invalid').optional().or(z.literal('')),
    birthDate: z.string().optional().or(z.literal(''))
        .refine((value) => !value || value <= today(), 'Data nașterii nu poate fi în viitor'),
    gender: z.enum(['M', 'F']).optional().or(z.literal('')),
    address: optionalText,
    category: z.enum(['adult', 'copil']),
    status: z.enum(['activ', 'inactiv']),

    // Date medicale
    bloodType: z.enum(BLOOD_TYPES).optional().or(z.literal('')),
    alergie: optionalText,
    chronicDiseases: optionalText,
    currentMedications: optionalText,
    notes: optionalText,
});

export type PatientFormData = z.infer<typeof patientSchema>;

// Câmpurile fiecărui tab din formular - ca să știm pe ce tab e o eroare
export const PERSONAL_FIELDS = ['firstName', 'lastName', 'idnp', 'phone', 'email', 'birthDate', 'gender', 'address', 'category'] as const;
