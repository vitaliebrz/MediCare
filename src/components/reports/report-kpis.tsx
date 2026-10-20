import { formatCell } from '@/lib/reports/format';
import type { ReportKpi } from '@/lib/reports/types';

// Cifrele-cheie ale raportului: o valoare mare + ce înseamnă (fără grafic, e un singur număr)
export const ReportKpis = ({ kpis, currency }: { kpis: ReportKpi[]; currency: string }) => (
    <div className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5'>
        {kpis.map((kpi) => (
            <div key={kpi.label} className='rounded-lg border bg-white p-4'>
                <p className='text-sm text-slate-500'>{kpi.label}</p>
                <p className='mt-1 text-xl font-bold tabular-nums md:text-2xl'>{formatCell(kpi.value, kpi.format, currency)}</p>
                {kpi.hint && <p className='mt-1 text-xs text-slate-500'>{kpi.hint}</p>}
            </div>
        ))}
    </div>
);
