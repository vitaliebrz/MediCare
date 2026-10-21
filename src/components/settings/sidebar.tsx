'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChartBarStacked, CircleUser, Hospital, Stethoscope, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/setari/clinica', label: 'Clinică', icon: Hospital },
    { href: '/setari/categorii', label: 'Categorii', icon: ChartBarStacked },
    { href: '/setari/servicii', label: 'Servicii', icon: Wrench },
    { href: '/setari/medici', label: 'Medici', icon: Stethoscope },
    { href: '/setari/notificari', label: 'Notificări', icon: Bell },
    { href: '/setari/cont', label: 'Cont', icon: CircleUser },
];

export const Sidebar = () => {
    const pathname = usePathname();
    return (
        <nav aria-label='Setări' className='flex gap-2 overflow-x-auto border-b bg-white p-2 lg:h-full lg:w-60 lg:flex-col lg:border-r lg:border-b-0 lg:p-4'>
            <span className='hidden px-3 text-sm font-bold text-zinc-500 lg:block'>SETĂRI</span>
            {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                            'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                            isActive
                                ? 'bg-teal-100/40 font-medium text-teal-500'
                                : 'text-zinc-500 hover:bg-slate-200/70 hover:text-zinc-700',
                        )}
                    >
                        <Icon className='h-5 w-5 shrink-0' />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
};
