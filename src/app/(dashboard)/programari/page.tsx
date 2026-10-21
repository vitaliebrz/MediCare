import { z } from 'zod';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { getDoctors } from '@/lib/actions/doctors';
import { getServices } from '@/lib/actions/services';
import { getCategories } from '@/lib/actions/categories';
import { getAppointments } from '@/lib/actions/appointments';
import { resolveCalendarView } from '@/lib/calendar';
import { todayInClinic } from '@/lib/dashboard-period';
import { PAGE_CLASS } from '@/lib/ui-classes';
import { PageHeader } from '@/components/page-header';
import { AppointmentsCalendar } from '@/components/appointments/appointments-calendar';

export default async function ProgramariPage({
    searchParams,
}: {
    searchParams: Promise<{ vedere?: string; data?: string; medic?: string }>;
}) {
    // Valorile din URL pot fi orice (le scrie utilizatorul); resolveCalendarView le verifică
    const params = await searchParams;
    const today = todayInClinic();
    const calendar = resolveCalendarView(params, today);

    // Medicul din URL, dacă arată ca un id valid (altfel Postgres ar da eroare la comparația cu uuid)
    const requested = z.uuid().safeParse(params.medic).success ? params.medic : undefined;
    // Toate pornesc împreună. getAppointments filtrează pe clinică, deci un medic străin dă doar o listă goală.
    const [clinic, doctors, services, categories, filtered] = await Promise.all([
        getClinicSettings(),
        getDoctors(),
        getServices(),
        getCategories(),
        getAppointments({ from: calendar.from, to: calendar.to, doctorId: requested }),
    ]);
    // Filtrul e valid doar dacă medicul e al clinicii; altfel (URL modificat) cerem toate programările
    const doctorId = requested && doctors.some((doctor) => doctor.id === requested) ? requested : undefined;
    const appointments = requested && !doctorId
        ? await getAppointments({ from: calendar.from, to: calendar.to })
        : filtered;

    return (
        <div className={PAGE_CLASS}>
            <PageHeader clinicName={clinic?.clinicName} trail={[{ label: 'Programări' }]} title='Programări' />
            <AppointmentsCalendar
                calendar={calendar}
                today={today}
                doctorId={doctorId}
                appointments={appointments}
                // Postgres întoarce ora ca '08:00:00'; calendarul lucrează cu 'HH:MM'
                dayStart={clinic?.dayStart.slice(0, 5) ?? '08:00'}
                dayEnd={clinic?.dayEnd.slice(0, 5) ?? '20:00'}
                doctors={doctors}
                services={services}
                categories={categories}
            />
        </div>
    );
}
