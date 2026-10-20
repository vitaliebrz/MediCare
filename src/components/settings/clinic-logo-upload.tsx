'use client'

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { removeClinicLogo, uploadClinicLogo } from '@/lib/actions/clinic-settings';
import { LOGO_TYPES, MAX_LOGO_BYTES } from '@/lib/clinic-logo';

// Logo-ul clinicii: se salvează imediat ce e ales (separat de formularul cu datele clinicii).
// Apare în PDF-uri (fișa 043/e, rapoarte) și în antetul paginii Rapoarte.
export const ClinicLogoUpload = ({ logoUrl }: { logoUrl: string | null }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');

    const handleFile = (file: File | undefined) => {
        if (!file) return;
        setError('');
        // Verificare rapidă în browser; serverul verifică din nou (tipul real, după conținut)
        if (!(Object.values(LOGO_TYPES) as string[]).includes(file.type)) return setError('Alege o imagine PNG sau JPG.');
        if (file.size > MAX_LOGO_BYTES) return setError('Imaginea e prea mare (maxim 1 MB).');

        const formData = new FormData();
        formData.set('logo', file);
        startTransition(async () => {
            const result = await uploadClinicLogo(formData);
            if (!result.success) setError(result.error ?? '');
            else toast.add({ title: 'Logo salvat', type: 'success' });
        });
        if (inputRef.current) inputRef.current.value = ''; // permite alegerea aceluiași fișier din nou
    };

    const handleRemove = () => {
        setError('');
        startTransition(async () => {
            const result = await removeClinicLogo();
            if (!result.success) setError(result.error ?? '');
            else toast.add({ title: 'Logo șters', type: 'success' });
        });
    };

    return (
        <Card className='max-w-xl'>
            <CardContent className='flex flex-col gap-3 p-2'>
                <div>
                    <p className='font-medium'>Logo clinică</p>
                    <p className='text-sm text-zinc-500'>Apare în fișele medicale (PDF) și în rapoarte. PNG sau JPG, maxim 1 MB.</p>
                </div>

                <div className='flex items-center gap-4'>
                    <div className='flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-zinc-50'>
                        {logoUrl
                            ? <Image src={logoUrl} alt='Logo-ul clinicii' width={80} height={80} className='h-full w-full object-contain' />
                            : <ImageIcon className='h-8 w-8 text-zinc-300' aria-hidden />}
                    </div>
                    <div className='flex flex-wrap gap-2'>
                        <input
                            ref={inputRef}
                            type='file'
                            accept='image/png,image/jpeg'
                            className='hidden'
                            onChange={(event) => handleFile(event.target.files?.[0])}
                        />
                        <Button
                            type='button'
                            disabled={isPending}
                            onClick={() => inputRef.current?.click()}
                            className='gap-2 bg-teal-500 hover:bg-teal-600 cursor-pointer'
                        >
                            {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Upload className='h-4 w-4' />}
                            {logoUrl ? 'Schimbă logo-ul' : 'Încarcă logo'}
                        </Button>
                        {logoUrl && (
                            <Button type='button' variant='outline' disabled={isPending} onClick={handleRemove} className='gap-2 text-red-600 cursor-pointer'>
                                <Trash2 className='h-4 w-4' /> Șterge
                            </Button>
                        )}
                    </div>
                </div>
                {error && <p className='text-sm text-red-600'>{error}</p>}
            </CardContent>
        </Card>
    );
};
