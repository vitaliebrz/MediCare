import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/format';

// Vechimea datoriilor ca 4 cutii, de la cea mai nouă la cea mai veche.
// Datoriile de peste 90 de zile sunt evidențiate (culoare + iconiță + text, nu doar culoare).
export const AgingBoxes = ({ buckets, currency }: {
    buckets: { label: string; amount: number; patients: number }[];
    currency: string;
}) => (
    <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        {buckets.map((bucket, index) => {
            const overdue = index === buckets.length - 1 && bucket.amount > 0;
            return (
                <div key={bucket.label} className={cn('rounded-md border p-3', overdue && 'border-amber-300 bg-amber-50')}>
                    <p className={cn('flex items-center gap-1 text-xs', overdue ? 'text-amber-800' : 'text-slate-500')}>
                        {overdue && <AlertTriangle className='h-3.5 w-3.5' aria-label='Restanță mare' />}
                        {bucket.label}
                    </p>
                    <p className='mt-1 text-lg font-bold tabular-nums'>{formatMoney(bucket.amount, currency)}</p>
                    <p className='text-xs text-slate-500'>{bucket.patients} {bucket.patients === 1 ? 'pacient' : 'pacienți'}</p>
                </div>
            );
        })}
    </div>
);
