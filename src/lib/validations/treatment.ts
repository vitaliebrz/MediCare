import { z } from 'zod';
import { isValidTooth } from '@/lib/teeth';

const today = () => new Date().toLocaleDateString('sv-SE');

// uuid opțional: în selector, "nimic ales" trimite ''
const optionalUuid = z.uuid().optional().or(z.literal(''));

export const treatmentSchema = z.object({
    // null = tratament general (fără dinte)
    toothNumber: z.number().int().nullable()
        .refine((tooth) => tooth === null || isValidTooth(tooth), 'Număr de dinte invalid'),
    serviceId: optionalUuid,
    doctorId: optionalUuid,
    diagnosis: z.string().trim().min(2, 'Diagnosticul este obligatoriu'),
    treatmentDescription: z.string().trim().min(2, 'Descrierea tratamentului este obligatorie'),
    recomendations: z.string().trim().optional().or(z.literal('')),
    price: z.number('Prețul trebuie să fie un număr').min(0, 'Prețul nu poate fi negativ'),
    paid: z.boolean(),
    performedAt: z.string().min(1, 'Alege data').refine((value) => value <= today(), 'Data nu poate fi în viitor'),
    // Noua stare a dintelui după tratament ('' = nu schimbăm starea)
    newToothStatus: z.enum(['sanatos', 'tratat', 'necesita_tratament', 'extras', 'cazut_natural']).optional().or(z.literal('')),
});

export type TreatmentFormData = z.infer<typeof treatmentSchema>;
