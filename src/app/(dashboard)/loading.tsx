import { BlockSkeleton, CardsSkeleton, HeaderSkeleton, LoadingPage } from '@/components/loading/skeletons';

// Ecranul de încărcare general (dashboard și paginile fără unul propriu).
// Apare imediat după click; meniul și bara de sus rămân pe loc.
export default function Loading() {
    return (
        <LoadingPage>
            <HeaderSkeleton action />
            <CardsSkeleton count={4} />
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
                <div className='lg:col-span-2'><BlockSkeleton /></div>
                <BlockSkeleton />
            </div>
        </LoadingPage>
    );
}
