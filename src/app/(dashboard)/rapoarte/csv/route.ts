import { getReport } from '@/lib/actions/reports';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { tableToCsv } from '@/lib/reports/csv';
import { todayInClinic } from '@/lib/dashboard-period';

// GET /rapoarte/csv?raport=financiar&tabel=debitori&perioada=30z&medic=<id>
// Un tabel al raportului, pentru Excel. Aceleași filtre ca pagina (getReport verifică sesiunea și clinica).
export async function GET(request: Request) {
    const search = new URL(request.url).searchParams;
    const [{ report }, clinic] = await Promise.all([
        getReport({
            raport: search.get('raport') ?? undefined,
            perioada: search.get('perioada') ?? undefined,
            medic: search.get('medic') ?? undefined,
        }),
        getClinicSettings(),
    ]);

    const table = report.tables.find((item) => item.id === search.get('tabel'));
    if (!table) {
        return new Response('Tabelul nu există în acest raport.', { status: 404 });
    }

    const fileName = `raport-${table.id}-${report.period.key}-${todayInClinic()}.csv`;
    return new Response(tableToCsv(table, clinic?.currency ?? 'MDL'), {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Cache-Control': 'private, no-store',
        },
    });
}
