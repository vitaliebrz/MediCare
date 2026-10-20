import Link from 'next/link';
import { CalendarX2 } from 'lucide-react';
import { doctorColor } from '@/lib/constants/doctor-colors';
import { StatusBadge } from '@/components/appointments/status-badge';
import type { DashboardData } from '@/lib/db/dashboard-queries';

export const TodayAppointments = ({ appointments }: { appointments: DashboardData['todayAppointments'] }) => {
    if (appointments.length === 0) {
        return (
            <div className='flex h-64 flex-col items-center justify-center gap-2 rounded-md border border-dashed text-center text-sm text-slate-500'>
                <CalendarX2 className='h-8 w-8 text-slate-300' />
                Nicio programare azi.
                <Link href='/programari' className='font-medium text-teal-600 hover:underline'>Vezi programările</Link>
            </div>
        );
    }

    return (
        // Lista se derulează dacă sunt multe programări, ca rândul să rămână la înălțimea graficului
        <ul className='flex max-h-64 flex-col divide-y overflow-y-auto'>
            {appointments.map((appointment) => {
                const color = doctorColor.find((item) => item.value === appointment.doctorColor)?.hex ?? '#a1a1aa';
                return (
                    <li key={appointment.id} className='flex gap-3 py-2'>
                        <span className='w-12 shrink-0 pt-0.5 text-sm font-semibold tabular-nums'>{appointment.time}</span>
                        <div className='min-w-0 flex-1'>
                            <Link href={`/pacienti/${appointment.patientId}`} className='block truncate text-sm font-medium hover:text-teal-600'>
                                {appointment.patientName}
                            </Link>
                            <p className='flex items-center gap-1.5 truncate text-xs text-slate-500'>
                                <span className='h-2 w-2 shrink-0 rounded-full' style={{ backgroundColor: color }} />
                                {appointment.doctorName ? `Dr. ${appointment.doctorName}` : 'Fără medic'}
                                {appointment.reason && ` · ${appointment.reason}`}
                            </p>
                        </div>
                        <StatusBadge status={appointment.status} className='h-fit' />
                    </li>
                );
            })}
        </ul>
    );
};
