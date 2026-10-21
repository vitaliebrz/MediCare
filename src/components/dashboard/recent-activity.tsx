import Link from 'next/link';
import { Stethoscope, UserPlus } from 'lucide-react';
import { formatDate, formatMoney } from '@/lib/format';
import { todayInClinic, addDays, CLINIC_TIME_ZONE } from '@/lib/dashboard-period';
import type { ActivityItem } from '@/lib/db/dashboard-queries';

// "acum 5 min", "acum 2 ore", "ieri", altfel data. Componentă de server: textul e calculat
// o singură dată, pe server, deci nu poate diferi între server și browser (hydration).
function relativeTime(iso: string, now = new Date()): string {
    const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return 'chiar acum';
    if (minutes < 60) return `acum ${minutes} min`;
    const day = new Date(iso).toLocaleDateString('sv-SE', { timeZone: CLINIC_TIME_ZONE });
    const today = todayInClinic(now);
    if (day === today) return `acum ${Math.floor(minutes / 60)} ${minutes < 120 ? 'oră' : 'ore'}`;
    if (day === addDays(today, -1)) return 'ieri';
    return formatDate(day);
}

export const RecentActivity = ({ items, currency }: { items: ActivityItem[]; currency: string }) => {
    if (items.length === 0) {
        return (
            <div className='flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-slate-500'>
                Nicio activitate încă.
            </div>
        );
    }

    return (
        <ul className='flex flex-col divide-y'>
            {items.map((item) => (
                <li key={`${item.type}-${item.id}`} className='flex gap-3 py-2.5'>
                    <span className='mt-0.5 h-fit rounded-md bg-teal-50 p-1.5 text-teal-600'>
                        {item.type === 'treatment' ? <Stethoscope className='h-4 w-4' /> : <UserPlus className='h-4 w-4' />}
                    </span>
                    <div className='min-w-0 flex-1 text-sm'>
                        {item.type === 'treatment' ? (
                            <p className='truncate'>
                                <span className='font-medium'>{item.title}</span>
                                {' · '}
                                <Link href={`/pacienti/${item.patientId}`} className='hover:text-teal-600 hover:underline'>{item.patientName}</Link>
                            </p>
                        ) : (
                            <p className='truncate'>
                                Pacient nou:{' '}
                                <Link href={`/pacienti/${item.patientId}`} className='font-medium hover:text-teal-600 hover:underline'>{item.patientName}</Link>
                            </p>
                        )}
                        <p className='text-xs text-slate-500'>{relativeTime(item.at)}</p>
                    </div>
                    {item.type === 'treatment' && (
                        <span className='shrink-0 text-right text-sm tabular-nums'>
                            {formatMoney(item.price, currency)}
                            <span className={item.paid ? 'block text-xs text-green-700' : 'block text-xs text-amber-700'}>
                                {item.paid ? 'achitat' : 'neachitat'}
                            </span>
                        </span>
                    )}
                </li>
            ))}
        </ul>
    );
};
