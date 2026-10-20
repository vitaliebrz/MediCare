import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { getDoctors } from '@/lib/actions/doctors';
import { getServices } from '@/lib/actions/services';
import { getCategories } from '@/lib/actions/categories';
import { getAppointments } from '@/lib/actions/appointments';
import { resolveCalendarView } from '@/lib/calendar';
import { todayInClinic } from '@/lib/dashboard-period';
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

    const [clinic, doctors, services, categories] = await Promise.all([
        getClinicSettings(),
        getDoctors(),
        getServices(),
        getCategories(),
    ]);
    // Filtrul de medic e valid doar dacă medicul e al clinicii
    const doctorId = doctors.some((doctor) => doctor.id === params.medic) ? params.medic : undefined;
    const appointments = await getAppointments({ from: calendar.from, to: calendar.to, doctorId });

    return (
        <div className='p-4 md:p-8 flex flex-col gap-4'>
            <p className='text-slate-500 mt-2'>{clinic?.clinicName ?? 'Clinica'}/Programări</p>
            <h1 className='text-2xl font-bold'>Programări</h1>
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
