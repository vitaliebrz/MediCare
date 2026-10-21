'use server';

import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getDoctors } from '@/lib/actions/doctors';
import { getReportForClinic } from '@/lib/db/report-queries';
import { parseReportKind, REPORT_META } from '@/lib/reports/params';

// Raportul cerut din URL. clinicId vine DOAR din sesiune, niciodată din browser.
export async function getReport(raw: { raport?: string; perioada?: string; medic?: string }) {
    const { clinicId } = await getCurrentUser();
    const kind = parseReportKind(raw.raport);
    // Medicul din URL, dacă raportul îl folosește și arată ca un id valid
    const requested = REPORT_META[kind].doctorFilter && z.uuid().safeParse(raw.medic).success ? raw.medic : undefined;

    // Medicii și raportul pornesc împreună. Interogările filtrează pe clinic_id, deci un medic
    // al altei clinici nu aduce nicio dată străină (doar un raport gol).
    const [doctors, filtered] = await Promise.all([
        getDoctors(),
        getReportForClinic(clinicId, { kind, periodKey: raw.perioada, doctorId: requested }),
    ]);
    // Filtrul e valid doar dacă medicul e al clinicii; altfel (caz rar, URL modificat) refacem raportul fără filtru
    const doctorId = requested && doctors.some((doctor) => doctor.id === requested) ? requested : undefined;
    const { months, report } = requested && !doctorId
        ? await getReportForClinic(clinicId, { kind, periodKey: raw.perioada })
        : filtered;
    return { kind, doctorId, doctors, months, report };
}
