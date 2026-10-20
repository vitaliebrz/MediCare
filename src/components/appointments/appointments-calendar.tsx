'use client'

import { useState } from 'react';
import { doctorColor } from '@/lib/constants/doctor-colors';
import { timeToMinutes, WEEKDAYS_SHORT, type CalendarView } from '@/lib/calendar';
import type { CalendarAppointment } from '@/lib/actions/appointments';
import { AppointmentForm, type AppointmentDefaults, type AppointmentFormOptions } from './appointment-form';
import { CalendarGrid, type CalendarColumn } from './calendar-grid';
import { CalendarToolbar, calendarHref } from './calendar-toolbar';
import { CalendarLegend } from './calendar-legend';

interface AppointmentsCalendarProps extends AppointmentFormOptions {
    calendar: CalendarView;
    today: string;
    doctorId?: string; // filtrul „medic” din URL
    appointments: CalendarAppointment[];
    dayStart: string; // 'HH:MM' din setările clinicii
    dayEnd: string;
}

interface FormState {
    open: boolean;
    key: number; // nou la fiecare deschidere -> formularul pornește curat
    appointment: CalendarAppointment | null;
    defaults: AppointmentDefaults;
}

export const AppointmentsCalendar = ({ calendar, today, doctorId, appointments, dayStart, dayEnd, doctors, services, categories }: AppointmentsCalendarProps) => {
    const [form, setForm] = useState<FormState>({
        open: false, key: 0, appointment: null, defaults: { date: today, time: dayStart, doctorId: doctorId ?? '' },
    });

    const openForm = (appointment: CalendarAppointment | null, defaults: AppointmentDefaults = form.defaults) =>
        setForm((previous) => ({ open: true, key: previous.key + 1, appointment, defaults }));

    // Intervalul grilei = programul din setări, lărgit dacă există programări în afara lui
    // (ca nicio programare să nu fie ascunsă), rotunjit la ore întregi
    const starts = appointments.map((appointment) => timeToMinutes(appointment.time));
    const ends = appointments.map((appointment) => timeToMinutes(appointment.time) + appointment.durationMinutes);
    const startMinutes = Math.floor(Math.min(timeToMinutes(dayStart), ...starts) / 60) * 60;
    const endMinutes = Math.min(Math.ceil(Math.max(timeToMinutes(dayEnd), ...ends) / 60) * 60, 24 * 60);

    const columns = calendar.view === 'saptamana'
        ? calendar.days.map((date, index): CalendarColumn => ({
            key: date,
            date,
            label: `${WEEKDAYS_SHORT[index]} ${Number(date.slice(8, 10))}`,
            href: calendarHref({ view: 'zi', date, doctorId }),
            isToday: date === today,
        }))
        : dayColumns(calendar.date, appointments, doctors, doctorId);

    // „Programare nouă” din buton: ziua afișată (sau azi, dacă e în săptămâna afișată), la începutul programului
    const newFromButton = () => openForm(null, {
        date: calendar.days.includes(today) ? today : calendar.date,
        time: dayStart,
        doctorId: doctorId ?? '',
    });

    return (
        <div className='flex flex-col gap-4'>
            <CalendarToolbar calendar={calendar} doctorId={doctorId} doctors={doctors} onNewAppointment={newFromButton} />
            <CalendarGrid
                columns={columns}
                appointments={appointments}
                startMinutes={startMinutes}
                endMinutes={endMinutes}
                onAppointmentClick={(appointment) => openForm(appointment)}
                onSlotClick={(column, time) => openForm(null, {
                    date: column.date,
                    time,
                    doctorId: column.doctorId ?? doctorId ?? '',
                })}
            />
            {/* În legendă: medicul din filtru sau toți medicii activi */}
            <CalendarLegend doctors={doctors.filter((doctor) => doctorId ? doctor.id === doctorId : doctor.active)} />
            <AppointmentForm
                key={form.key}
                open={form.open}
                onOpenChange={(open) => setForm((previous) => ({ ...previous, open }))}
                appointment={form.appointment}
                defaults={form.defaults}
                doctors={doctors}
                services={services}
                categories={categories}
            />
        </div>
    );
};

// Vizualizarea Zi: câte o coloană pentru fiecare medic activ (sau doar medicul din filtru),
// plus medicii inactivi care au totuși programări în ziua respectivă și „Fără medic” dacă e cazul.
function dayColumns(
    date: string,
    appointments: CalendarAppointment[],
    doctors: AppointmentFormOptions['doctors'],
    doctorId: string | undefined,
): CalendarColumn[] {
    const visible = doctors.filter((doctor) => doctorId
        ? doctor.id === doctorId
        : doctor.active || appointments.some((appointment) => appointment.doctorId === doctor.id));

    const columns: CalendarColumn[] = visible.map((doctor) => ({
        key: doctor.id,
        date,
        doctorId: doctor.id,
        label: `Dr. ${doctor.lastName}`,
        sublabel: doctor.firstName,
        color: doctorColor.find((item) => item.value === doctor.color)?.hex,
    }));

    const hasUnassigned = appointments.some((appointment) => appointment.doctorId === null);
    if (!doctorId && (hasUnassigned || columns.length === 0)) {
        columns.push({ key: 'fara-medic', date, doctorId: null, label: 'Fără medic' });
    }
    return columns;
}
