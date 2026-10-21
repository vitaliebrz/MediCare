import { z } from 'zod'

export const forgotPasswordSchema = z.object({
    email: z.email('Introdu un email valid'),
})

export const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Parola trebuie să aibă cel puțin 8 caractere'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Parolele nu coincid',
    path: ['confirmPassword'],
})

export const registerSchema = z.object({
    clinicName: z.string().trim().min(2, 'Introdu numele clinicii'),
    fullName: z.string().trim().min(2, 'Introdu numele tău complet'),
    email: z.email('Introdu un email valid'),
    password: z.string().min(8, 'Parola trebuie să aibă cel puțin 8 caractere'),
})

export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
