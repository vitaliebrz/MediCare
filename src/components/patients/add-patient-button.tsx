'use client'

import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientForm } from './patientForm';

// Butonul e creat aici, într-o componentă client, nu în page.tsx (Server Component).
// Un element creat pe server și dat ca `trigger` unui Dialog din browser
// producea un "hydration mismatch" (data-slot diferit pe server și în browser).
export const AddPatientButton = () => (
    <PatientForm
        trigger={
            <Button className='bg-teal-500 hover:bg-teal-600 cursor-pointer gap-2'>
                <UserPlus className='h-4 w-4' /> Pacient nou
            </Button>
        }
    />
);
