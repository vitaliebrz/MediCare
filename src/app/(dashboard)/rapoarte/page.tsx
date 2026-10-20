import Image from 'next/image';
import { getReport } from '@/lib/actions/reports';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { reportQuery, type ReportParams } from '@/lib/reports/params';
import { ReportFilters } from '@/components/reports/report-filters';
import { ReportTabs } from '@/components/reports/report-tabs';
import { ReportKpis } from '@/components/reports/report-kpis';
import { ReportCharts } from '@/components/reports/report-charts';
import { ReportTableCard } from '@/components/reports/report-table';
import { AgingBoxes } from '@/components/reports/aging-boxes';
import { OccupancyHeatmap } from '@/components/reports/occupancy-heatmap';

// Structura și definițiile (Facturat, Încasat, Datorie...): docs/plans/rapoarte.md
export default async function RapoartePage({
    searchParams,
}: {
    searchParams: Promise<{ raport?: string; perioada?: string; medic?: string }>;
}) {
    const raw = await searchParams;
    const [{ kind, doctorId, doctors, months, report }, clinic] = await Promise.all([getReport(raw), getClinicSettings()]);
    const currency = clinic?.currency ?? 'MDL';
    const params: ReportParams = { kind, periodKey: report.period.key, doctorId };
    const doctor = doctors.find((item) => item.id === doctorId);

    return (
        <div className='p-4 md:p-8 flex flex-col gap-4'>
            <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
                <div className='flex items-center gap-3'>
                    {/* Logo-ul clinicii (din Setări → Clinică), ca în PDF-ul raportului */}
                    {clinic?.logoUrl && (
                        <Image src={clinic.logoUrl} alt={`Logo ${clinic.clinicName}`} width={48} height={48} className='h-12 w-12 rounded-md border bg-white object-contain' />
                    )}
                    <div>
                        <p className='text-slate-500'>{clinic?.clinicName ?? 'Clinica'}/Rapoarte</p>
                        <h1 className='text-2xl font-bold'>Rapoarte</h1>
                    </div>
                </div>
                <ReportFilters params={params} periodLabel={report.period.label} months={months} doctors={doctors} />
            </div>

            <ReportTabs params={params} />

            <p className='text-sm text-slate-500'>
                <span className='font-medium text-slate-700'>{report.title}</span> · {report.period.label}
                {doctor && <> · Dr. {doctor.lastName} {doctor.firstName}</>}
            </p>

            <ReportKpis kpis={report.kpis} currency={currency} />
            <ReportCharts report={report} currency={currency} />

            {report.tables.map((table) => (
                <ReportTableCard
                    key={table.id}
                    table={table}
                    currency={currency}
                    csvHref={`/rapoarte/csv${reportQuery(params, { tabel: table.id })}`}
                >
                    {/* Unele tabele se citesc mai ușor ca imagine; CSV-ul și PDF-ul le au ca tabel */}
                    {report.kind === 'financiar' && table.id === 'vechime-datorii' && report.aging.some((bucket) => bucket.amount > 0)
                        ? <AgingBoxes buckets={report.aging} currency={currency} />
                        : report.kind === 'programari' && table.id === 'ocupare'
                            ? <OccupancyHeatmap hours={report.occupancy.hours} grid={report.occupancy.grid} />
                            : undefined}
                </ReportTableCard>
            ))}
        </div>
    );
}
