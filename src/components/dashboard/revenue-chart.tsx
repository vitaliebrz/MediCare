'use client'

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { formatDate, formatMoney } from '@/lib/format';

interface RevenueChartProps {
    data: { date: string; total: number }[];
    granularity: 'day' | 'month';
    currency: string;
}

// O singură serie (suma încasată), deci o singură culoare și fără legendă: titlul cardului spune ce e
const REVENUE_COLOR = '#0d9488'; // teal-600
const chartConfig = { total: { label: 'Încasat', color: REVENUE_COLOR } } satisfies ChartConfig;

const SHORT_MONTHS = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// Etichete pe axa X: "15.10" pe zile, "oct 26" pe luni
export const axisLabel = (date: string, granularity: 'day' | 'month') => {
    const [year, month, day] = date.split('-');
    return granularity === 'day' ? `${day}.${month}` : `${SHORT_MONTHS[Number(month) - 1]} ${year.slice(2)}`;
};

// 12500 -> "12,5k" pe axa Y, ca etichetele să rămână scurte
export const compact = (value: number) => (value >= 1000 ? `${(value / 1000).toLocaleString('ro-RO', { maximumFractionDigits: 1 })}k` : String(value));

export const RevenueChart = ({ data, granularity, currency }: RevenueChartProps) => {
    const hasRevenue = data.some((point) => point.total > 0);

    if (!hasRevenue) {
        return (
            <div className='flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-slate-500'>
                Nicio încasare în această perioadă.
            </div>
        );
    }

    return (
        <ChartContainer config={chartConfig} className='aspect-auto h-64 w-full'>
            <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
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
                        const point = payload[0].payload as { date: string; total: number };
                        return (
                            <div className='rounded-lg border bg-white px-3 py-2 text-xs shadow-md'>
                                <p className='text-slate-500'>
                                    {granularity === 'day' ? formatDate(point.date) : axisLabel(point.date, 'month')}
                                </p>
                                <p className='mt-0.5 font-semibold tabular-nums'>{formatMoney(point.total, currency)}</p>
                            </div>
                        );
                    }}
                />
                <Bar dataKey='total' fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
        </ChartContainer>
    );
};
