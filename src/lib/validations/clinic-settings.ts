import { z } from 'zod';

export const clinicSettingsSchema = z.object({
    clinicName: z.string().min(2, 'Numele clinicii trebuie să aibă minim 2 caractere'),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Email invalid').optional().or(z.literal('')),
    logoUrl: z.string().optional(),
    workingHours: z.string().optional(),
    currency: z.string().default('MDL'),

})
export type ClinicSettingsFormData = z.infer<typeof clinicSettingsSchema>;