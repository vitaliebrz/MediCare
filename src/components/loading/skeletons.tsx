import { Skeleton } from '@/components/ui/skeleton';

// Piese pentru ecranele de încărcare (loading.tsx). Imită forma paginii, ca trecerea
// de la schelet la pagina reală să nu „sară”. Apar imediat după click, cât timp serverul pregătește datele.

export const LoadingPage = ({ children }: { children: React.ReactNode }) => (
    <div className='p-4 md:p-8 flex flex-col gap-4' role='status' aria-live='polite'>
        <span className='sr-only'>Se încarcă…</span>
        {children}
    </div>
);

// Calea (Clinica/Pagina) + titlul
export const HeaderSkeleton = ({ action = false }: { action?: boolean }) => (
    // Aceleași dimensiuni ca PageHeader: calea (text-sm) + titlul (text-2xl)
    <div className='flex items-end justify-between gap-3'>
        <div className='flex flex-col gap-1'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='h-8 w-56' />
        </div>
        {action && <Skeleton className='h-9 w-40' />}
    </div>
);

export const CardsSkeleton = ({ count, className = 'grid-cols-2 lg:grid-cols-4' }: { count: number; className?: string }) => (
    <div className={`grid gap-3 ${className}`}>
        {Array.from({ length: count }, (_, index) => (
            <div key={index} className='flex flex-col gap-2 rounded-lg border bg-white p-4'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-7 w-32' />
            </div>
        ))}
    </div>
);

export const BlockSkeleton = ({ className = 'h-72' }: { className?: string }) => (
    <div className='rounded-lg border bg-white p-4'>
        <Skeleton className='mb-4 h-5 w-48' />
        <Skeleton className={`w-full ${className}`} />
    </div>
);

export const TableSkeleton = ({ rows = 8 }: { rows?: number }) => (
    <div className='flex flex-col gap-2 rounded-md border bg-white p-3'>
        <Skeleton className='h-8 w-full' />
        {Array.from({ length: rows }, (_, index) => <Skeleton key={index} className='h-10 w-full' />)}
    </div>
);
