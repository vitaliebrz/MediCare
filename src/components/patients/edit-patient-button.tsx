'use client'

import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/db/schema';
import { PatientForm } from './patientForm';

// Componentă client: butonul (trigger-ul) trebuie creat în browser, nu în pagina server
// (altfel apare hydration mismatch - vezi add-patient-button.tsx)
export const EditPatientButton = ({ patient, label = 'Editează', className }: { patient: Patient; label?: string; className?: string }) => (
    <PatientForm
        initialData={patient}
        trigger={
            <Button variant='outline' className={cn('cursor-pointer gap-2', className)}>
                <Pencil className='h-4 w-4' /> {label}
            </Button>
        }
    />
);
