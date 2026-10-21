'use client'

import { Loader2, Trash2, type LucideIcon } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string; // ex. „Ștergeți serviciul?”
    description: React.ReactNode; // ce se pierde și, dacă există, alternativa (arhivare, dezactivare)
    onConfirm: () => void;
    pending?: boolean; // acțiunea e în curs: butoanele sunt blocate, apare rotița
    confirmLabel?: string; // textul butonului roșu (implicit „Șterge”)
    icon?: LucideIcon; // iconița din antet (implicit coșul de gunoi)
}

// Confirmarea comună pentru ORICE ștergere din aplicație (și alte acțiuni greu de anulat, ex. deconectarea
// de pe toate dispozitivele). Nimic nu se șterge dintr-un singur click: întâi apare acest dialog,
// iar utilizatorul alege „Șterge” sau „Anulează”.
export const ConfirmDialog = ({
    open, onOpenChange, title, description, onConfirm, pending = false, confirmLabel = 'Șterge', icon: Icon = Trash2,
}: ConfirmDialogProps) => (
    // Cât timp acțiunea rulează, dialogul nu se poate închide (nici cu Esc, nici cu click în afară)
    <AlertDialog open={open} onOpenChange={(next) => { if (!pending) onOpenChange(next) }}>
        <AlertDialogContent size='sm'>
            <AlertDialogHeader>
                <AlertDialogMedia className='bg-destructive/10 text-destructive'>
                    <Icon />
                </AlertDialogMedia>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel variant='outline' disabled={pending} className='cursor-pointer'>Anulează</AlertDialogCancel>
                <AlertDialogAction variant='destructive' disabled={pending} onClick={onConfirm} className='cursor-pointer gap-2'>
                    {pending && <Loader2 className='h-4 w-4 animate-spin' />}
                    {confirmLabel}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
);
