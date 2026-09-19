'use client';

import { Bell, UserPlus, Search, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DentalToothIcon from '@iconify-react/hugeicons/dental-tooth';

interface TopbarProps {
    userEmail: string;
    userName?: string;
    userRole?: string;
}

export const Topbar = ({ userEmail, userName, userRole }: TopbarProps) => {
    const initials = (userName || userEmail)
        .split(' ')
        .map((s) => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const handleLogout = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <div className='bg-white h-[76.5px] px-5 border-b flex items-center justify-between gap-4'>
            <div className='flex gap-2 items-center flex-1'>
                <div className='md:hidden bg-teal-500 text-white p-1 rounded-lg shrink-0'>
                    <DentalToothIcon className='h-7 w-7' />
                </div>
                <div className='relative w-full md:w-[400px]'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
                    <Input
                        type="text"
                        placeholder='Caută pacienți, nr.tel...'
                        className='pl-9'
                    />
                </div>
            </div>

            <div className='flex gap-4 items-center'>
                <Button className='hidden md:flex gap-2 border rounded-md bg-teal-100 hover:bg-teal-200 text-teal-500 hover:text-teal-600 font-medium transition duration-200 ease-in-out hover:cursor-pointer'>
                    <UserPlus className='h-5 w-5 shrink-0' /> Pacienți noi
                </Button>

                <Button className='relative bg-accent hover:bg-teal-200/50 hover:cursor-pointer'>
                    <Bell className='text-zinc-500 hover:text-zinc-700' />
                    <span className='absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-teal-500' />
                </Button>

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