import { BlockSkeleton, CardsSkeleton, HeaderSkeleton, LoadingPage, TableSkeleton } from '@/components/loading/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

// Raportul: tab-uri, cifre-cheie, grafic, tabel
export default function Loading() {
    return (
        <LoadingPage>
            <HeaderSkeleton action />
            <Skeleton className='h-10 w-full max-w-xl' />
            <CardsSkeleton count={5} className='grid-cols-2 md:grid-cols-3 xl:grid-cols-5' />
            <BlockSkeleton className='h-64' />
            <TableSkeleton rows={5} />
        </LoadingPage>
    );
}
