import { CalendarCheck, HandCoins, Users, Wallet } from 'lucide-react';
import { getDashboardData } from '@/lib/actions/dashboard';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { percentChange } from '@/lib/percent-change';
import { formatMoney } from '@/lib/format';
import { PAGE_CLASS } from '@/lib/ui-classes';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { PeriodSelect } from '@/components/dashboard/period-select';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { TopTreatmentsChart } from '@/components/dashboard/top-treatments-chart';
import { TodayAppointments } from '@/components/dashboard/today-appointments';
import { RecentActivity } from '@/components/dashboard/recent-activity';

// Structura și regulile de calcul: docs/plans/dashboard.md
export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ perioada?: string }>;
}) {
    const { perioada } = await searchParams;
    const [data, clinic] = await Promise.all([getDashboardData(perioada), getClinicSettings()]);
    const { period, kpis } = data;
    const currency = clinic?.currency ?? 'MDL';
    const periodTotal = data.revenueSeries.reduce((sum, point) => sum + point.total, 0);

    return (
        <div className={PAGE_CLASS}>
            <PageHeader
                clinicName={clinic?.clinicName}
                trail={[{ label: 'Dashboard' }]}
                title='Dashboard'
                action={<PeriodSelect value={period.key} label={period.label} months={data.months} />}
            />

            {/* Cifre-cheie */}
            <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
                <StatCard
                    title='Pacienți totali'
                    value={String(kpis.patients.current)}
                    icon={Users}
                    change={percentChange(kpis.patients.current, kpis.patients.previous)}
                    higherIsBetter
                    comparisonLabel={period.comparisonLabel}
                />
                <StatCard
                    title='Programări'
                    value={String(kpis.appointments.current)}
                    icon={CalendarCheck}
                    change={percentChange(kpis.appointments.current, kpis.appointments.previous)}
                    higherIsBetter
                    comparisonLabel={period.comparisonLabel}
                />
                <StatCard
                    title='Venit'
                    value={formatMoney(kpis.revenue.current, currency)}
                    icon={Wallet}
                    change={percentChange(kpis.revenue.current, kpis.revenue.previous)}
                    higherIsBetter
                    comparisonLabel={period.comparisonLabel}
                />
                <StatCard
                    title='Datorii totale'
                    value={formatMoney(kpis.debt.current, currency)}
                    icon={HandCoins}
                    change={percentChange(kpis.debt.current, kpis.debt.previous)}
                    higherIsBetter={false}
                    comparisonLabel={period.comparisonLabel}
                    footnote={`${kpis.debt.debtors} ${kpis.debt.debtors === 1 ? 'pacient datorează' : 'pacienți datorează'}`}
                />
            </div>

            {/* Rândul 2: încasări (2/3) + programări azi (1/3) */}
            <div className='grid gap-4 lg:grid-cols-3'>
                <section className='rounded-lg border bg-white p-4 lg:col-span-2'>
                    <div className='mb-4 flex items-baseline justify-between gap-2'>
                        <h2 className='font-semibold'>Încasări în perioadă</h2>
                        <span className='text-sm text-slate-500 tabular-nums'>{formatMoney(periodTotal, currency)}</span>
                    </div>
                    <RevenueChart data={data.revenueSeries} granularity={period.granularity} currency={currency} />
                </section>
                <section className='rounded-lg border bg-white p-4'>
                    <h2 className='mb-4 font-semibold'>Programări azi</h2>
                    <TodayAppointments appointments={data.todayAppointments} />
                </section>
            </div>

            {/* Rândul 3: top tratamente + activitate recentă */}
            <div className='grid gap-4 lg:grid-cols-2'>
                <section className='rounded-lg border bg-white p-4'>
                    <h2 className='mb-4 font-semibold'>Top 5 tratamente</h2>
                    <TopTreatmentsChart data={data.topTreatments} currency={currency} />
                </section>
                <section className='rounded-lg border bg-white p-4'>
                    <h2 className='mb-4 font-semibold'>Activitate recentă</h2>
                    <RecentActivity items={data.recentActivity} currency={currency} />
                </section>
            </div>
        </div>
    );
}
