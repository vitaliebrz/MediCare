import type { Report } from '@/lib/db/report-queries';
import { BilledCollectedChart } from './billed-collected-chart';
import { HorizontalBars } from './horizontal-bars';
import { CountChart } from './count-chart';

// Graficele specifice fiecărui raport (tabelele și cifrele-cheie sunt comune, vezi page.tsx)
export const ReportCharts = ({ report, currency }: { report: Report; currency: string }) => {
    switch (report.kind) {
        case 'financiar':
            return (
                <ChartCard title='Facturat și încasat'>
                    <BilledCollectedChart data={report.series} granularity={report.period.granularity} currency={currency} />
                </ChartCard>
            );
        case 'medici':
            return (
                <ChartCard title='Facturat pe medic' description='Valoarea tratamentelor efectuate în perioadă'>
                    <HorizontalBars data={report.chart} currency={currency} emptyText='Niciun tratament efectuat în această perioadă.' />
                </ChartCard>
            );
        case 'servicii':
            return (
                <ChartCard title='Top 10 servicii după facturat'>
                    <HorizontalBars data={report.chart} currency={currency} emptyText='Niciun tratament efectuat în această perioadă.' />
                </ChartCard>
            );
        case 'programari':
            return (
                <ChartCard title='Pacienți noi' description='Pacienți înregistrați în perioadă (toți medicii)'>
                    <CountChart data={report.newPatients} granularity={report.period.granularity} label='Pacienți noi' emptyText='Niciun pacient nou în această perioadă.' />
                </ChartCard>
            );
    }
};

export const ChartCard = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
    <section className='flex flex-col gap-3 rounded-lg border bg-white p-4'>
        <div>
            <h2 className='font-semibold'>{title}</h2>
            {description && <p className='text-xs text-slate-500'>{description}</p>}
        </div>
        {children}
    </section>
);
