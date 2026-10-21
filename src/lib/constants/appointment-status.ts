import { CheckCheck, CircleCheck, Clock, UserX, X, type LucideIcon } from 'lucide-react';
import type { AppointmentStatus } from '@/lib/db/schema';

// Eticheta, culorile și iconița fiecărui status, folosite în dashboard („Programări azi”),
// pe blocurile din calendar și în legenda calendarului.
// Iconița face statusul vizibil și fără culoare (culoarea blocului e a medicului).
export const APPOINTMENT_STATUS: Record<AppointmentStatus, { label: string; className: string; icon: LucideIcon; iconClassName: string; description: string }> = {
    programat: {
        label: 'Programat', className: 'bg-zinc-100 text-zinc-600',
        icon: Clock, iconClassName: 'text-slate-500', description: 'încă neconfirmat de pacient',
    },
    confirmat: {
        label: 'Confirmat', className: 'bg-teal-50 text-teal-700',
        icon: CircleCheck, iconClassName: 'text-teal-600', description: 'pacientul a confirmat că vine',
    },
    finalizat: {
        label: 'Finalizat', className: 'bg-green-50 text-green-700',
        icon: CheckCheck, iconClassName: 'text-green-600', description: 'vizita a avut loc',
    },
    anulat: {
        label: 'Anulat', className: 'bg-red-50 text-red-700 line-through',
        icon: X, iconClassName: 'text-red-600', description: 'programarea nu mai are loc',
    },
    neprezentat: {
        label: 'Neprezentat', className: 'bg-amber-50 text-amber-700',
        icon: UserX, iconClassName: 'text-amber-600', description: 'pacientul nu a venit',
    },
};
