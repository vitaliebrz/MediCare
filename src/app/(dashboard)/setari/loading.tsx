import { HeaderSkeleton, LoadingPage, TableSkeleton } from '@/components/loading/skeletons';

// Setările: antet cu buton + tabel. Stă în layout-ul Setărilor, deci meniul lor rămâne pe loc.
export default function Loading() {
    return (
        <LoadingPage>
            <HeaderSkeleton action />
            <TableSkeleton rows={6} />
        </LoadingPage>
    );
}
