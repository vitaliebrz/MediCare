import { z } from 'zod'

export const doctorsSchema = z.object({
    firstName: z.string().nonempty('Prenumele este obligatoriu'),
    lastName: z.string().nonempty('Numele este obligatoriu'),
    categoryId: z.uuid('Categoria trebuie selectată'),
    phone: z.string().regex(/^\+?[0-9]{8,15}$/, 'Numărul de telefon trebuie să aibă 8-15 cifre, opțional cu + la început').optional().or(z.literal('')),
    email: z.string().email('Email invalid').optional().or(z.literal('')),
    hireDate: z.string().optional(),
    active: z.boolean().default(true),
    color: z.enum(['blue', 'green', 'purple', 'orange', 'pink', 'teal']),
})

export type DoctorFormData = z.infer<typeof doctorsSchema>