import { doctorColor } from '@/lib/constants/doctor-colors';
import { APPOINTMENT_STATUS } from '@/lib/constants/appointment-status';
import { APPOINTMENT_STATUS_VALUES } from '@/lib/validations/appointment';
import type { Doctors } from '@/lib/db/schema';
import { NO_DOCTOR_COLOR } from './appointment-block';
import { StatusBadge } from './status-badge';

// Ce înseamnă culorile și iconițele din calendar:
// culoarea blocului = medicul, eticheta colorată = statusul programării
export const CalendarLegend = ({ doctors }: { doctors: Doctors[] }) => (
    <div className='flex flex-col gap-3 rounded-md border bg-white p-3 text-sm dark:bg-slate-950 md:flex-row md:gap-8'>
        <div className='flex flex-col gap-2'>
            <p className='text-xs font-medium uppercase tracking-wide text-slate-500'>Culoare = medic</p>
            <ul className='flex flex-wrap gap-x-4 gap-y-1.5'>
                {doctors.map((doctor) => (
                    <li key={doctor.id} className='flex items-center gap-1.5'>
                        <Swatch color={doctorColor.find((item) => item.value === doctor.color)?.hex ?? NO_DOCTOR_COLOR} />
                        Dr. {doctor.lastName}
                    </li>
                ))}
                <li className='flex items-center gap-1.5 text-slate-500'>
                    <Swatch color={NO_DOCTOR_COLOR} /> Fără medic
                </li>
            </ul>
        </div>

        <div className='flex flex-col gap-2'>
            <p className='text-xs font-medium uppercase tracking-wide text-slate-500'>Etichetă = status</p>
            <ul className='flex flex-wrap gap-x-4 gap-y-1.5'>
                {APPOINTMENT_STATUS_VALUES.map((status) => (
                    <li key={status} className='flex items-center gap-1.5'>
                        <StatusBadge status={status} />
                        <span className='text-xs text-slate-500'>{APPOINTMENT_STATUS[status].description}</span>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

const Swatch = ({ color }: { color: string }) => (
    <span className='h-3 w-3 shrink-0 rounded-sm border-l-[3px]' style={{ borderLeftColor: color, backgroundColor: `${color}40` }} />
);
