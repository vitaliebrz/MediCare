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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50">
            {navItems.map((item) => {
                const isActive = item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                    <Link key={item.href} href={item.href} className="flex-1">
                        <div
                            className={cn(
                                'flex flex-col gap-1 items-center py-2 text-xs transition-colors',
                                isActive
                                    ? 'text-teal-500 font-medium'
                                    : 'text-zinc-500 hover:text-zinc-700'
                            )}
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span>{item.label}</span>
                        </div>
                    </Link>
                );
            })}
        </nav>
    );
};