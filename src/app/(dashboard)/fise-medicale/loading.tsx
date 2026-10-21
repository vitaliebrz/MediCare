import { HeaderSkeleton, LoadingPage, TableSkeleton } from '@/components/loading/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

// Lista: filtre + tabel
export default function Loading() {
    return (
        <LoadingPage>
            <HeaderSkeleton />
            <div className='flex flex-col-reverse gap-3 md:flex-row md:justify-between'>
                <Skeleton className='h-9 w-64' />
                <Skeleton className='h-9 w-full md:w-80' />
            </div>
            <TableSkeleton rows={10} />
        </LoadingPage>
    );
}
