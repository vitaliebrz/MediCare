'use client';

import { useState, useTransition } from 'react';
import { LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { signOutEverywhere } from '@/lib/actions/account';

// Deconectarea de pe toate dispozitivele (ex. ai uitat contul deschis pe calculatorul din cabinet)
export const SecurityCard = () => {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleConfirm = () => {
        setError('');
        startTransition(async () => {
            // La succes, acțiunea redirecționează la /login; aici ajungem doar dacă a eșuat
            const result = await signOutEverywhere();
            if (result && !result.success) {
                setError(result.error);
                setOpen(false);
            }
        });
    };

    return (
        <Card>
            <CardContent className='flex flex-col gap-3 p-4'>
                <div>
                    <h2 className='text-lg font-semibold'>Securitate</h2>
                    <p className='text-sm text-slate-500'>
                        Ai uitat contul deschis pe alt calculator sau telefon? Închide sesiunile de pe toate dispozitivele, inclusiv acesta.
                    </p>
                </div>
                {error && <p className='text-sm text-red-600'>{error}</p>}
                <Button variant='outline' className='w-fit cursor-pointer gap-2 text-red-600' onClick={() => setOpen(true)}>
                    <LogOut className='h-4 w-4' /> Deconectează-mă de pe toate dispozitivele
                </Button>
            </CardContent>

            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                icon={LogOut}
                title='Deconectare de pe toate dispozitivele?'
                description='Vei fi trimis la pagina de login și va trebui să intri din nou, pe toate dispozitivele. Pe celelalte dispozitive, sesiunea se închide în cel mult o oră.'
                confirmLabel='Deconectează'
                pending={isPending}
                onConfirm={handleConfirm}
            />
        </Card>
    );
};
