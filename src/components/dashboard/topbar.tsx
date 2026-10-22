'use client';

import { useRouter } from 'next/navigation';
import { UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DentalToothIcon from '@iconify-react/hugeicons/dental-tooth';
import { PatientForm } from '../patients/patientForm';
import { NotificationBell } from '../notifications/notification-bell';
import type { AppNotification } from '@/lib/db/notification-queries';

interface TopbarProps {
    userEmail: string;
    userName?: string;
    notifications: Promise<AppNotification[]>;
}

export const Topbar = ({ userEmail, userName, notifications }: TopbarProps) => {
    const router = useRouter();
    const initials = (userName || userEmail)
        .split(' ')
        .map((s) => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const handleLogout = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };


    return (
        // box-content + pt: în aplicația instalată, bara coboară sub zona ceasului/camerei (pe calculator zona e 0)
        <div className='box-content bg-white h-[76.5px] pt-[env(safe-area-inset-top)] px-5 border-b flex items-center justify-between gap-4'>
            <div className='flex gap-2 items-center flex-1'>
                <div className='md:hidden bg-teal-500 text-white p-1 rounded-lg shrink-0'>
                    <DentalToothIcon className='h-7 w-7' />
                </div>
            </div>

            <div className='flex gap-4 items-center'>
                {/* Pe telefon doar iconița, pe ecran mare și textul */}
                <PatientForm
                    trigger={
                        <Button
                            title='Pacient nou'
                            aria-label='Pacient nou'
                            className='flex gap-2 rounded-md border border-teal-200 bg-teal-50 font-medium text-teal-700 transition duration-200 ease-in-out hover:cursor-pointer hover:bg-teal-100 hover:text-teal-800'
                        >
                            <UserPlus className='h-5 w-5 shrink-0' />
                            <span className='hidden md:inline'>Pacient nou</span>
                        </Button>
                    } />

                <NotificationBell notifications={notifications} />

                <DropdownMenu>
                    <DropdownMenuTrigger className="md:hidden rounded-full">
                        <Avatar className="cursor-pointer">
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <div className="px-2 py-1.5">
                            <p className="text-sm font-medium">{userName || 'Utilizator'}</p>
                            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                        </div>
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                            <LogOut className="h-4 w-4 mr-2" />
                            Deconectare
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};