'use client'

import { Cell, Pie, PieChart, Tooltip } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { formatMoney } from '@/lib/format';

interface TopTreatmentsChartProps {
    data: { name: string; count: number; total: number }[];
    currency: string;
}

// Paletă categorială în ordine FIXĂ (slotul 1 = cel mai frecvent serviciu), validată pentru
// contrast și daltonism cu scriptul din ghidul de vizualizare. „Altele” e mereu gri.
// Galbenul are contrast mic pe alb, de aceea legenda scrie mereu numele, numărul și procentul.
const SLICE_COLORS = ['#0d9488', '#eb6834', '#2a78d6', '#eda100', '#4a3aa7'];
const OTHER_COLOR = '#a1a1aa';

const chartConfig = {} satisfies ChartConfig;

export const TopTreatmentsChart = ({ data, currency }: TopTreatmentsChartProps) => {
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);

    if (totalCount === 0) {
        return (
            <div className='flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-slate-500'>
                Niciun tratament în această perioadă.
            </div>
        );
    }

    const slices = data.map((item, index) => ({
        ...item,
        color: item.name === 'Altele' ? OTHER_COLOR : SLICE_COLORS[index],
        percent: Math.round((item.count / totalCount) * 100),
    }));

    return (
        <div className='flex flex-col gap-4'>
            <div className='relative'>
                <ChartContainer config={chartConfig} className='mx-auto aspect-square h-56'>
                    <PieChart>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const slice = payload[0].payload as (typeof slices)[number];
                                return (
                                    <div className='rounded-lg border bg-white px-3 py-2 text-xs shadow-md'>
                                        <p className='font-semibold'>{slice.name}</p>
                                        <p className='text-slate-600 tabular-nums'>
                                            {slice.count} {slice.count === 1 ? 'tratament' : 'tratamente'} · {slice.percent}%
                                        </p>
                                        <p className='text-slate-600 tabular-nums'>{formatMoney(slice.total, currency)}</p>
                                    </div>
                                );
                            }}
                        />
                        {/* Gol în mijloc (gogoașă) + contur alb de 2px între felii, ca cele vecine să se distingă */}
                        <Pie data={slices} dataKey='count' nameKey='name' innerRadius='62%' outerRadius='100%' stroke='#ffffff' strokeWidth={2}>
                            {slices.map((slice) => (
                                <Cell key={slice.name} fill={slice.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
                {/* Totalul în mijlocul cercului */}
                <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
                    <span className='text-2xl font-bold tabular-nums'>{totalCount}</span>
                    <span className='text-xs text-slate-500'>tratamente</span>
                </div>
            </div>

            {/* Legenda: ce înseamnă fiecare culoare */}
            <ul className='flex flex-col gap-2 text-sm'>
                {slices.map((slice) => (
                    <li key={slice.name} className='flex items-center gap-2'>
                        <span className='h-3 w-3 shrink-0 rounded-sm' style={{ backgroundColor: slice.color }} />
                        <span className='flex-1 truncate' title={slice.name}>{slice.name}</span>
                        <span className='tabular-nums text-slate-600'>{slice.count}</span>
                        <span className='w-10 text-right tabular-nums text-slate-500'>{slice.percent}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
