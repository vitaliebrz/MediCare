'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import DentalToothIcon from '@iconify-react/hugeicons/dental-tooth';
import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from 'lucide-react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/pacienti', label: 'Pacienți', icon: Users },
    { href: '/programari', label: 'Programări', icon: Calendar },
    { href: '/fise-medicale', label: 'Fișe medicale', icon: FileText },
    { href: '/rapoarte', label: 'Rapoarte', icon: BarChart3 },
];

interface SidebarProps {
    userEmail: string;
    userName?: string;
    userRole?: string;
}

export const Sidebar = ({ userEmail, userName, userRole }: SidebarProps) => {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    const handleLogout = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        window.location.href = '/login';
    };

    // Citește preferința salvată la montare
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved === 'true') {
            setCollapsed(true);
        }
    }, []);

    // Salvează preferința de fiecare dată când se schimbă
    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(collapsed));
    }, [collapsed]);

    const initials = (userName || userEmail)
        .split(' ')
        .map((s) => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <aside
            className={cn(
                'hidden md:flex flex-col h-screen justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-200',
                collapsed ? 'w-[72px]' : 'w-64'
            )}
        >
            <div>
                {/* Logo */}
            <div className={cn(
                'p-5 flex gap-2 items-center text-lg text-slate-900 font-semibold border-b-1',
                collapsed && 'justify-center px-0'
            )}>
                <div className='bg-teal-500 text-white p-1 rounded-lg shrink-0'>
                    <DentalToothIcon className='h-7 w-7' />
                </div>
                {!collapsed && <span>MediCare</span>}
            </div>

            {/* Navigation */}
            <div className='p-5 flex flex-col gap-2 '>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={cn(
                                    'flex gap-2 items-center px-3 py-2 rounded-lg text-sm transition-colors',
                                    isActive
                                        ? 'bg-teal-100/40 text-teal-500 font-medium'
                                        : 'text-zinc-500 hover:bg-slate-200/70 hover:text-zinc-700',
                                    collapsed && 'justify-center px-0'
                                )}
                                title={collapsed ? item.label : undefined}
                            >
                                <Icon className="h-5 w-5 shrink-0" />
                                {!collapsed && <span>{item.label}</span>}
                            </div>
                        </Link>
                    );
                })}
            </div>
            </div>
            

            {/* Bottom section */}
            <div className='p-5 flex flex-col gap-2 border-t-1'>
                <Link href='/setari/clinica'>
                    <div
                        className={cn(
                            'flex gap-2 items-center px-3 py-2 rounded-lg text-sm transition-colors',
                            pathname.startsWith('/setari')
                                ? 'bg-teal-100/40 text-teal-500 font-medium'
                                : 'text-zinc-500 hover:bg-slate-200/70 hover:text-zinc-700',
                            collapsed && 'justify-center px-0'
                        )}
                        title={collapsed ? 'Setări' : undefined}
                    >
                        <Settings className='h-5 w-5 shrink-0' />
                        {!collapsed && <span>Setări</span>}
                    </div>
                </Link>

                {/* User card + Logout */}
                <div className={cn(
                    'flex items-center gap-2',
                    collapsed ? 'hidden' : 'justify-between'
                )}>
                    <div className={cn('flex gap-2 items-center', collapsed && 'flex-col')}>
                        <Avatar>
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        {!collapsed && (
                            <div className='flex flex-col'>
                                <span className='text-sm font-medium'>{userName}</span>
                                <span className='text-xs text-zinc-500'>{userRole}</span>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className='text-zinc-500 p-2 rounded-lg hover:text-zinc-700 hover:bg-slate-200/70 hover:cursor-pointer'
                        title="Deconectare"
                    >
                        <LogOut className='h-4 w-4' />
                    </button>
                </div>

                {/* Buton collapse */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:bg-slate-200/70 hover:text-zinc-700 hover:cursor-pointer',
                        collapsed && 'justify-center px-0'
                    )}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <>
                            <ChevronLeft className="h-4 w-4" />
                            <span>Restrânge</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
};