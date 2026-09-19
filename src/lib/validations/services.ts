import { z } from 'zod';
export const servicesSchema = z.object({
    name: z.string().min(2, 'Numele serviciului trebuie să aibă minim 2 caractere'),
    category: z.string().min(1,'Categoria este un câmp obligatoriu'),
    description: z.string().optional(),
    price: z.number('Prețul este un câmp obligatoriu').min(0,'Prețul nu poate fi mai mic de 0'),
    durationMinutes: z.number('Durata este un câmp obligatoriu').int('Durata trebuie să fie un număr întreg').min(5,'Durata nu poate fi mai puțin de 5 minute').max(480, 'Durata nu poate fi mai mare de 480 min'),
    active: z.boolean().default(true)
})

export type ServicesFormData = z.infer<typeof servicesSchema>;