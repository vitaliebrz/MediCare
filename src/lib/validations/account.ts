import { z } from 'zod';

// Profilul utilizatorului logat (Setări → Cont). Emailul și rolul nu se schimbă de aici.
export const profileSchema = z.object({
    fullName: z.string().trim().min(2, 'Introdu numele tău complet'),
    phone: z.string().trim().max(30, 'Numărul de telefon e prea lung'),
});
export type ProfileFormData = z.infer<typeof profileSchema>;

// Schimbarea parolei: parola curentă + cea nouă de două ori (aceeași regulă de 8 caractere ca la resetare)
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Introdu parola curentă'),
    password: z.string().min(8, 'Parola trebuie să aibă cel puțin 8 caractere'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Parolele nu coincid',
    path: ['confirmPassword'],
}).refine((data) => data.password !== data.currentPassword, {
    message: 'Parola nouă trebuie să fie diferită de cea curentă',
    path: ['password'],
});
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
