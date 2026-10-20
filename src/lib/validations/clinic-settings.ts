import { z } from 'zod';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Ora trebuie să fie în formatul HH:MM');

export const clinicSettingsSchema = z.object({
    clinicName: z.string().min(2, 'Numele clinicii trebuie să aibă minim 2 caractere'),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Email invalid').optional().or(z.literal('')),
    logoUrl: z.string().optional(),
    workingHours: z.string().optional(),
    currency: z.string().default('MDL'),
    // Intervalul orar afișat în calendarul de programări
    dayStart: hhmm,
    dayEnd: hhmm,
}).refine((data) => data.dayStart < data.dayEnd, {
    // 'HH:MM' se compară corect ca text ('08:00' < '18:00')
    message: 'Ora de sfârșit trebuie să fie după ora de început',
    path: ['dayEnd'],
})
export type ClinicSettingsFormData = z.infer<typeof clinicSettingsSchema>;
