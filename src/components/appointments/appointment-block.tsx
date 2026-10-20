import { cn } from '@/lib/utils';
import { doctorColor } from '@/lib/constants/doctor-colors';
import { APPOINTMENT_STATUS } from '@/lib/constants/appointment-status';
import { endTime } from '@/lib/calendar';
import type { CalendarAppointment } from '@/lib/actions/appointments';
import type { AppointmentStatus } from '@/lib/db/schema';
import { StatusBadge } from './status-badge';

export const NO_DOCTOR_COLOR = '#a1a1aa'; // gri pentru programările fără medic

// Stilul în plus al unor statusuri pe tot blocul (pe lângă eticheta de status)
const STATUS_BLOCK_CLASS: Partial<Record<AppointmentStatus, string>> = {
    anulat: 'opacity-50 line-through',
    neprezentat: 'ring-1 ring-amber-500',
};

interface AppointmentBlockProps {
    appointment: CalendarAppointment;
    style: React.CSSProperties; // poziția și înălțimea, calculate de grilă
    onClick: () => void;
}

export const AppointmentBlock = ({ appointment, style, onClick }: AppointmentBlockProps) => {
    const color = doctorColor.find((item) => item.value === appointment.doctorColor)?.hex ?? NO_DOCTOR_COLOR;
    const short = appointment.durationMinutes < 30; // la programări scurte încape un singur rând
    const status = appointment.status;

    return (
        <button
            type='button'
            onClick={(event) => {
                event.stopPropagation(); // altfel click-ul ajunge și la slotul gol de dedesubt
                onClick();
            }}
            title={`${appointment.time}–${endTime(appointment.time, appointment.durationMinutes)} · ${appointment.patientName} · ${appointment.serviceName ?? ''} · ${APPOINTMENT_STATUS[status].label}`}
            className={cn(
                '@container absolute overflow-hidden rounded-md border-l-[3px] px-1.5 text-left text-xs cursor-pointer',
                'transition-shadow hover:z-10 hover:shadow-md focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-teal-500',
                short ? 'flex items-center gap-1 py-0' : 'py-1',
                STATUS_BLOCK_CLASS[status],
            )}
            // Culoarea medicului: chenar plin în stânga + fundal transparent (hex + '1f' ≈ 12% opacitate)
            style={{ ...style, borderLeftColor: color, backgroundColor: `${color}1f` }}
        >
            {short ? (
                // Programare scurtă: un singur rând, statusul doar ca iconiță colorată
                <>
                    <StatusBadge status={status} className='px-1' labelClassName='sr-only' />
                    <span className='font-semibold tabular-nums text-slate-700 dark:text-slate-200'>{appointment.time}</span>
                </>
            ) : (
                // Rândul de sus: ora + eticheta statusului. Ce încape depinde de lățimea blocului (container queries):
                // ora de sfârșit apare de la 11rem, textul statusului de la 7.5rem (altfel rămâne doar iconița)
                <span className='flex items-center justify-between gap-1'>
                    <span className='font-semibold tabular-nums text-slate-700 dark:text-slate-200'>
                        {appointment.time}
                        <span className='hidden @[11rem]:inline'>–{endTime(appointment.time, appointment.durationMinutes)}</span>
                    </span>
                    <StatusBadge status={status} labelClassName='sr-only @[7.5rem]:not-sr-only' />
                </span>
            )}
            <span className={cn('truncate font-medium text-slate-900 dark:text-slate-50', short ? 'min-w-0' : 'block')}>
                {appointment.patientName}
            </span>
            {!short && appointment.serviceName && (
                <span className='block truncate text-slate-600 dark:text-slate-300'>{appointment.serviceName}</span>
            )}
        </button>
    );
};
