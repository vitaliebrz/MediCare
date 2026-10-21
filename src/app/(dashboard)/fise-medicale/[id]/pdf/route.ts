import { getPatientChart } from '@/lib/actions/treatments';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { todayInClinic } from '@/lib/dashboard-period';
import { renderMedicalRecordPdf } from '@/components/medical-record/medical-record-pdf';
import { loadLogoForPdf } from '@/lib/clinic-logo';

// GET /fise-medicale/<id>/pdf            -> fișa 043/e deschisă în browser (de acolo se printează)
// GET /fise-medicale/<id>/pdf?descarca=1 -> aceeași fișă, descărcată ca fișier
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    // getPatientChart verifică utilizatorul logat și clinica lui: alt pacient / id invalid -> null
    const [chart, clinic] = await Promise.all([getPatientChart(id), getClinicSettings()]);
    if (!chart) {
        return new Response('Pacientul nu există.', { status: 404 });
    }

    const logo = await loadLogoForPdf(clinic?.logoUrl);
    const pdf = await renderMedicalRecordPdf({ chart, clinic, issuedOn: todayInClinic(), logo });

    const { patient } = chart;
    const fileName = `fisa-043e-nr${patient.recordNumber ?? ''}-${slug(`${patient.lastName} ${patient.firstName}`)}.pdf`;
    const download = new URL(request.url).searchParams.has('descarca');

    return new Response(new Uint8Array(pdf), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${fileName}"`,
            // Date medicale: browserul nu păstrează fișa în cache
            'Cache-Control': 'private, no-store',
        },
    });
}

// "Țurcanu Ștefan" -> "turcanu-stefan" (numele fișierului fără diacritice și spații)
function slug(text: string) {
    return text
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
