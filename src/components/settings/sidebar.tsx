import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

import { Hospital } from 'lucide-react';
import { Wrench } from 'lucide-react';
import { User } from 'lucide-react';
import { Bell } from 'lucide-react';
import { ChartBarStacked } from 'lucide-react';

const navItems = [
    { href: '/setari/clinica', label: 'Clinică', icon: Hospital },
    { href: '/setari/categorii', label: 'Categorii', icon: ChartBarStacked  },

    { href: '/setari/servicii', label: 'Servicii', icon: Wrench },
    { href: '/setari/medici', label: 'Medici', icon: User },
    { href: '/setari/notificari', label: 'Notificări', icon: Bell },
    { href: '/setari/cont', label: 'Cont', icon: User },

]
export const Sidebar = () => {
    const pathname = usePathname();
    return (
        <nav  className=' bg-white flex gap-5 lg:gap-2 p-2 lg:p-4 lg:flex-col lg:border-r lg:w-60 lg:h-full overflow-x-auto'>
            <span className='hidden lg:block text-sm font-bold text-zinc-500'>SETĂRI</span>
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                    <Link key={item.href} href={item.href} className=''>
                        <div className={cn('flex gap-2 items-center p-2 rounded-lg text-sm',
                            isActive
                                ? 'md:bg-teal-100/40 text-teal-500 font-medium'
                                : 'text-zinc-500 hover:bg-slate-200/70 hover:text-zinc-700')}
                        >
                            <Icon />
                            <span>{item.label}</span>
                        </div>
                    </Link>
                )
            })}
        </nav>
    )
}