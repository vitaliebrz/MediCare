import { formatMoney } from '@/lib/format';
import { doctorColor } from '@/lib/constants/doctor-colors';

const DEFAULT_COLOR = '#0d9488'; // teal, ca seria „bani” din dashboard
const NO_DOCTOR_COLOR = '#a1a1aa';

// Bare orizontale: comparație de mărime între entități cu nume lungi (medici, servicii).
// Numele și suma sunt scrise direct lângă bară (text în culorile textului, nu ale barei),
// deci identitatea nu depinde de culoare. `color` = numele culorii medicului din setări.
export const HorizontalBars = ({ data, currency, emptyText }: {
    data: { label: string; value: number; color: string | null }[];
    currency: string;
    emptyText: string;
}) => {
    const max = Math.max(...data.map((item) => item.value), 0);
    if (max === 0) {
        return <p className='rounded-md border border-dashed py-8 text-center text-sm text-slate-500'>{emptyText}</p>;
    }

    return (
        <ul className='flex flex-col gap-2'>
            {data.map((item) => {
                const hex = item.color ? doctorColor.find((color) => color.value === item.color)?.hex ?? DEFAULT_COLOR : null;
                const fill = hex ?? (item.label === 'Fără medic' ? NO_DOCTOR_COLOR : DEFAULT_COLOR);
                return (
                    <li key={item.label} className='grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[minmax(0,14rem)_1fr_auto]'>
                        <span className='truncate text-slate-700' title={item.label}>{item.label}</span>
                        <div className='h-4 rounded-sm bg-slate-100' title={`${item.label}: ${formatMoney(item.value, currency)}`}>
                            {/* capătul barei rotunjit, baza dreaptă (ancorată la 0) */}
                            <div className='h-full rounded-r' style={{ width: `${(item.value / max) * 100}%`, backgroundColor: fill }} />
                        </div>
                        <span className='text-right font-medium tabular-nums text-slate-700'>{formatMoney(item.value, currency)}</span>
                    </li>
                );
            })}
        </ul>
    );
};
