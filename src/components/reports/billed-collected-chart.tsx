'use client'

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { axisLabel, compact } from '@/components/dashboard/revenue-chart';
import { formatDate, formatMoney } from '@/lib/format';

// Două serii pe aceeași axă (aceeași unitate, bani), deci un singur ax Y.
// Culori: Încasat = teal, ca în dashboard (culoarea urmează seria); Facturat = albastru.
// Perechea a trecut validatorul dataviz (inclusiv daltonism, ΔE 15,7).
const SERIES = {
    billed: { label: 'Facturat', color: '#2a78d6' },
    collected: { label: 'Încasat', color: '#0d9488' },
} as const;
const chartConfig = SERIES satisfies ChartConfig;

interface Point { date: string; billed: number; collected: number }

export const BilledCollectedChart = ({ data, granularity, currency }: {
    data: Point[];
    granularity: 'day' | 'month';
    currency: string;
}) => {
    if (!data.some((point) => point.billed > 0 || point.collected > 0)) {
        return (
            <div className='flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-slate-500'>
                Nicio sumă facturată sau încasată în această perioadă.
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-2'>
            {/* Legenda: 2 serii -> mereu prezentă, ca identitatea să nu depindă doar de culoare */}
            <div className='flex gap-4 text-xs text-slate-600'>
                {Object.values(SERIES).map((series) => (
                    <span key={series.label} className='flex items-center gap-1.5'>
                        <span className='h-2.5 w-2.5 rounded-sm' style={{ backgroundColor: series.color }} />
                        {series.label}
                    </span>
                ))}
            </div>
            <ChartContainer config={chartConfig} className='aspect-auto h-64 w-full'>
                <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2}>
                    <CartesianGrid vertical={false} strokeDasharray='3 3' />
                    <XAxis
                        dataKey='date'
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={16}
                        tickFormatter={(date: string) => axisLabel(date, granularity)}
                    />
                    <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={compact} />
                    <Tooltip
                        cursor={{ fill: 'var(--muted)' }}
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const point = payload[0].payload as Point;
                            return (
                                <div className='rounded-lg border bg-white px-3 py-2 text-xs shadow-md'>
                                    <p className='text-slate-500'>{granularity === 'day' ? formatDate(point.date) : axisLabel(point.date, 'month')}</p>
                                    {(['billed', 'collected'] as const).map((key) => (
                                        <p key={key} className='mt-0.5 flex items-center gap-1.5'>
                                            <span className='h-2 w-2 rounded-sm' style={{ backgroundColor: SERIES[key].color }} />
                                            {SERIES[key].label}: <span className='font-semibold tabular-nums'>{formatMoney(point[key], currency)}</span>
                                        </p>
                                    ))}
                                </div>
                            );
                        }}
                    />
                    <Bar dataKey='billed' fill={SERIES.billed.color} radius={[4, 4, 0, 0]} maxBarSize={24} />
                    <Bar dataKey='collected' fill={SERIES.collected.color} radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
            </ChartContainer>
        </div>
    );
};
