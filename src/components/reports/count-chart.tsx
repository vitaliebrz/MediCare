'use client'

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { axisLabel } from '@/components/dashboard/revenue-chart';
import { formatDate } from '@/lib/format';

// O singură serie de numărare (ex. pacienți noi) pe zile sau luni.
// Albastru: e o altă mărime decât banii (teal), deci altă culoare; o serie -> fără legendă, titlul spune ce e.
const COLOR = '#2a78d6';

export const CountChart = ({ data, granularity, label, emptyText }: {
    data: { date: string; count: number }[];
    granularity: 'day' | 'month';
    label: string;
    emptyText: string;
}) => {
    if (!data.some((point) => point.count > 0)) {
        return <div className='flex h-48 items-center justify-center rounded-md border border-dashed text-sm text-slate-500'>{emptyText}</div>;
    }
    const chartConfig = { count: { label, color: COLOR } } satisfies ChartConfig;

    return (
        <ChartContainer config={chartConfig} className='aspect-auto h-48 w-full'>
            <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray='3 3' />
                <XAxis dataKey='date' tickLine={false} axisLine={false} tickMargin={8} minTickGap={16}
                    tickFormatter={(date: string) => axisLabel(date, granularity)} />
                <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                <Tooltip
                    cursor={{ fill: 'var(--muted)' }}
                    content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const point = payload[0].payload as { date: string; count: number };
                        return (
                            <div className='rounded-lg border bg-white px-3 py-2 text-xs shadow-md'>
                                <p className='text-slate-500'>{granularity === 'day' ? formatDate(point.date) : axisLabel(point.date, 'month')}</p>
                                <p className='mt-0.5'>{label}: <span className='font-semibold tabular-nums'>{point.count}</span></p>
                            </div>
                        );
                    }}
                />
                <Bar dataKey='count' fill={COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
        </ChartContainer>
    );
};
