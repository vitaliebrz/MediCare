import { cn } from '@/lib/utils';
import { APPOINTMENT_STATUS } from '@/lib/constants/appointment-status';
import type { AppointmentStatus } from '@/lib/db/schema';

// Eticheta colorată a statusului (iconiță + text), aceeași în calendar, legendă, formular și dashboard.
// labelClassName permite ascunderea textului când nu e loc (rămâne doar iconița, iar textul e citit de cititoarele de ecran).
export const StatusBadge = ({ status, className, labelClassName }: {
    status: AppointmentStatus;
    className?: string;
    labelClassName?: string;
}) => {
    const { label, className: colors, icon: Icon, iconClassName } = APPOINTMENT_STATUS[status];
    return (
        <span className={cn(
            'inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-current/20',
            colors,
            className,
        )}>
            <Icon className={cn('h-3 w-3 shrink-0', iconClassName)} aria-hidden />
            <span className={cn('whitespace-nowrap', labelClassName)}>{label}</span>
        </span>
    );
};
