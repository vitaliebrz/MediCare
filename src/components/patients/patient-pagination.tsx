import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PatientStatusFilter } from '@/lib/actions/patient';

interface PatientPaginationProps {
    page: number;
    totalPages: number;
    total: number;
    q: string;
    status: PatientStatusFilter;
    basePath?: string; // pagina pe care e paginarea (lista e folosită și în /fise-medicale)
}

// Linkuri simple (fără JavaScript în browser): fiecare pagină e un URL cu ?page=N
export const PatientPagination = ({ page, totalPages, total, q, status, basePath = '/pacienti' }: PatientPaginationProps) => {
    const hrefFor = (targetPage: number) => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (status !== 'activ') params.set('status', status);
        if (targetPage > 1) params.set('page', String(targetPage));
        const query = params.toString();
        return query ? `${basePath}?${query}` : basePath;
    };

    const linkClass = (disabled: boolean) =>
        cn(buttonVariants({ variant: 'outline', size: 'sm' }), disabled && 'pointer-events-none opacity-50');

    return (
        <div className='flex items-center justify-between text-sm text-slate-500'>
            <span>{total} {total === 1 ? 'pacient' : 'pacienți'}</span>
            {totalPages > 1 && (
                <div className='flex items-center gap-2'>
                    <Link href={hrefFor(page - 1)} className={linkClass(page <= 1)} aria-disabled={page <= 1}>
                        <ChevronLeft /> Înapoi
                    </Link>
                    <span>Pagina {page} din {totalPages}</span>
                    <Link href={hrefFor(page + 1)} className={linkClass(page >= totalPages)} aria-disabled={page >= totalPages}>
                        Înainte <ChevronRight />
                    </Link>
                </div>
            )}
        </div>
    );
};
