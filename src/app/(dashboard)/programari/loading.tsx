import { HeaderSkeleton, LoadingPage } from '@/components/loading/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

// Calendarul: bara de navigare + grila săptămânii
export default function Loading() {
    return (
        <LoadingPage>
            <HeaderSkeleton />
            <div className='flex flex-wrap items-center gap-2'>
                <Skeleton className='h-9 w-36' />
                <Skeleton className='h-7 w-56' />
                <Skeleton className='ml-auto h-9 w-96 max-w-full' />
            </div>
            <div className='grid grid-cols-[3.5rem_repeat(7,1fr)] gap-px overflow-hidden rounded-md border bg-slate-100'>
                {Array.from({ length: 8 * 9 }, (_, index) => (
                    <div key={index} className='h-14 bg-white p-1'>
                        {index % 8 !== 0 && index % 5 === 0 && <Skeleton className='h-10 w-full' />}
                    </div>
                ))}
            </div>
        </LoadingPage>
    );
}
