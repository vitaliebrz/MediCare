import { BlockSkeleton, CardsSkeleton, LoadingPage, TableSkeleton } from '@/components/loading/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

// Fișa pacientului: antet, sumar financiar, schema dentară și istoricul
export default function Loading() {
    return (
        <LoadingPage>
            <div className='flex items-end justify-between gap-3'>
                <div className='flex flex-col gap-1'>
                    <Skeleton className='h-5 w-64' />
                    <Skeleton className='h-8 w-64' />
                    <Skeleton className='h-4 w-80' />
                </div>
                <Skeleton className='h-9 w-56' />
            </div>
            <CardsSkeleton count={3} className='grid-cols-3' />
            <Skeleton className='h-9 w-80' />
            <BlockSkeleton className='h-64' />
            <TableSkeleton rows={4} />
        </LoadingPage>
    );
}
