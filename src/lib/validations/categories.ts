import { z } from 'zod';
export const categorySchema = z.object({
    name: z.string().min(2, 'Numele categoriei trebuie să aibă minim 2 caractere')
})
export type CategoryFormData = z.infer<typeof categorySchema>;