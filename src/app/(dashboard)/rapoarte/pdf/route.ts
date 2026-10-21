import { getReport } from '@/lib/actions/reports';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { todayInClinic } from '@/lib/dashboard-period';
import { renderReportPdf } from '@/components/reports/report-pdf';
import { loadLogoForPdf } from '@/lib/clinic-logo';

// GET /rapoarte/pdf?raport=financiar&perioada=30z&medic=<id>
// Raportul întreg în PDF, deschis în browser (de acolo se printează sau se salvează).
export async function GET(request: Request) {
    const search = new URL(request.url).searchParams;
    const [{ report, doctors, doctorId }, clinic] = await Promise.all([
        getReport({
            raport: search.get('raport') ?? undefined,
            perioada: search.get('perioada') ?? undefined,
            medic: search.get('medic') ?? undefined,
        }),
        getClinicSettings(),
    ]);

    const doctor = doctors.find((item) => item.id === doctorId);
    const today = todayInClinic();
    const pdf = await renderReportPdf({
        report,
        clinic,
        filterLabel: doctor ? `Dr. ${doctor.lastName} ${doctor.firstName}` : null,
        generatedOn: today,
        logo: await loadLogoForPdf(clinic?.logoUrl),
    });

    return new Response(new Uint8Array(pdf), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="raport-${report.kind}-${report.period.key}-${today}.pdf"`,
            'Cache-Control': 'private, no-store',
        },
    });
}
