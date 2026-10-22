'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    BarChart3,
    Settings,
} from 'lucide-react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/pacienti', label: 'Pacienți', icon: Users },
    { href: '/programari', label: 'Programări', icon: Calendar },
    { href: '/fise-medicale', label: 'Fișe', icon: FileText },
    { href: '/rapoarte', label: 'Rapoarte', icon: BarChart3 },
    { href: '/setari', label: 'Setări', icon: Settings },
];

export const Bottombar = () => {
    const pathname = usePathname();

    return (
        // Zonele sigure (env(safe-area-inset-*)): jos bara de gesturi / linia „home”, lateral colțurile
        // rotunjite ale ecranului. Fără ele, bara stătea sub linia de gesturi, iar Dashboard și Setări,
        // la margini, intrau în colțuri. Pe calculator și în browser zonele sunt 0.
        <nav
            aria-label='Navigare'
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] shadow-[0_-1px_4px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900"
        >
            {navItems.map((item) => {
                const isActive = item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                    <Link key={item.href} href={item.href} aria-current={isActive ? 'page' : undefined} className="min-w-0 flex-1">
                        <div
                            className={cn(
                                'flex flex-col items-center gap-1 pt-2 pb-1.5 text-[11px] leading-tight transition-colors',
                                isActive
                                    ? 'font-semibold text-teal-600'
                                    : 'text-slate-600 hover:text-slate-900'
                            )}
                        >
                            {/* Pagina activă: iconița pe un fundal turcoaz deschis, ca să se vadă și dintr-o privire */}
                            <span className={cn('rounded-full px-3 py-0.5', isActive && 'bg-teal-50')}>
                                <Icon className="h-5 w-5 shrink-0" />
                            </span>
                            <span className="max-w-full truncate px-0.5">{item.label}</span>
                        </div>
                    </Link>
                );
            })}
        </nav>
    );
};