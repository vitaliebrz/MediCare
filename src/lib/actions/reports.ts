'use server';

import { getCurrentUser } from '@/lib/auth/current-user';
import { getDoctors } from '@/lib/actions/doctors';
import { getReportForClinic } from '@/lib/db/report-queries';
import { parseReportKind, REPORT_META } from '@/lib/reports/params';

// Raportul cerut din URL. clinicId vine DOAR din sesiune, niciodată din browser.
export async function getReport(raw: { raport?: string; perioada?: string; medic?: string }) {
    const { clinicId } = await getCurrentUser();
    const kind = parseReportKind(raw.raport);
    const doctors = await getDoctors();
    // Filtrul de medic e valid doar dacă medicul e al clinicii și raportul îl folosește
    const doctorId = REPORT_META[kind].doctorFilter && doctors.some((doctor) => doctor.id === raw.medic) ? raw.medic : undefined;

    const { months, report } = await getReportForClinic(clinicId, { kind, periodKey: raw.perioada, doctorId });
    return { kind, doctorId, doctors, months, report };
}
