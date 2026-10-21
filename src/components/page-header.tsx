import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
    label: string;
    href?: string; // fără href = pagina curentă (text simplu)
}

interface PageHeaderProps {
    clinicName?: string | null;
    // Calea de după numele clinicii, ex. [{ label: 'Setări' }, { label: 'Servicii' }]
    trail: Crumb[];
    title: React.ReactNode;
    description?: React.ReactNode;
    // Ce stă lângă titlu (ex. logo-ul clinicii în Rapoarte)
    leading?: React.ReactNode;
    // Butoanele / filtrele din dreapta
    action?: React.ReactNode;
}

// Antetul comun al paginilor: calea, titlul, descrierea și butoanele.
// Toate paginile îl folosesc, ca titlul să stea la aceeași înălțime și să arate la fel peste tot.
export const PageHeader = ({ clinicName, trail, title, description, leading, action }: PageHeaderProps) => {
    const crumbs: Crumb[] = [{ label: clinicName || 'Clinica', href: '/' }, ...trail];
    return (
        <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
            <div className='flex items-center gap-3'>
                {leading}
                <div className='flex min-w-0 flex-col gap-1'>
                    <nav aria-label='Cale'>
                        <ol className='flex flex-wrap items-center gap-1 text-sm text-slate-500'>
                            {crumbs.map((crumb, index) => (
                                <li key={index} className='flex items-center gap-1'>
                                    {index > 0 && <ChevronRight className='h-3.5 w-3.5 text-slate-400' aria-hidden />}
                                    {crumb.href && index < crumbs.length - 1
                                        ? <Link href={crumb.href} className='hover:text-teal-600'>{crumb.label}</Link>
                                        : <span aria-current={index === crumbs.length - 1 ? 'page' : undefined}>{crumb.label}</span>}
                                </li>
                            ))}
                        </ol>
                    </nav>
                    <h1 className='text-2xl font-bold'>{title}</h1>
                    {description && <div className='text-sm text-slate-500'>{description}</div>}
                </div>
            </div>
            {action && <div className='flex flex-wrap items-center gap-2'>{action}</div>}
        </div>
    );
};
