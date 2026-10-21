import Link from 'next/link';
import { CalendarClock, CalendarX2, Cake, ChevronRight, HandCoins, PhoneCall, UserPen, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppNotification, NotificationKind } from '@/lib/db/notification-queries';

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
    unconfirmed: CalendarClock,
    pending: CalendarX2,
    debts: HandCoins,
    incomplete: UserPen,
    recall: PhoneCall,
    birthdays: Cake,
};

// warning = ceva de rezolvat (chihlimbar), info = bine de știut (turcoaz). Iconița spune tipul și fără culoare.
const TONE_CLASS = {
    warning: 'bg-amber-50 text-amber-700',
    info: 'bg-teal-50 text-teal-700',
};

// Lista de alerte, aceeași în clopoțel și pe pagina Setări → Notificări.
// compact = în clopoțel: fără lista de nume, doar titlul și linkul.
export const NotificationList = ({ notifications, compact = false, onNavigate }: {
    notifications: AppNotification[];
    compact?: boolean;
    onNavigate?: () => void; // închide clopoțelul după click pe un link
}) => (
    <ul className={cn('flex flex-col', compact ? 'gap-1' : 'gap-3')}>
        {notifications.map((notification) => {
            const Icon = KIND_ICON[notification.kind];
            return (
                <li key={notification.kind} className={cn(!compact && 'rounded-lg border bg-white p-4')}>
                    <Link
                        href={notification.href}
                        onClick={onNavigate}
                        className={cn('group flex items-start gap-3', compact && '-mx-1 rounded-md p-1.5 hover:bg-slate-100')}
                    >
                        <span className={cn('rounded-lg p-2', TONE_CLASS[notification.tone])}>
                            <Icon className='h-4 w-4' aria-hidden />
                        </span>
                        <span className='flex-1 pt-1 text-sm font-medium group-hover:text-teal-600'>{notification.title}</span>
                        <ChevronRight className='mt-1.5 h-4 w-4 shrink-0 text-slate-400' aria-hidden />
                    </Link>

                    {!compact && (
                        <ul className='mt-3 flex flex-col divide-y border-t text-sm'>
                            {notification.items.map((item, index) => (
                                <li key={index}>
                                    <Link href={item.href} className='flex items-center justify-between gap-3 py-2 hover:text-teal-600'>
                                        <span className='font-medium'>{item.label}</span>
                                        <span className='text-slate-500 tabular-nums'>{item.detail}</span>
                                    </Link>
                                </li>
                            ))}
                            {notification.count > notification.items.length && (
                                <li className='pt-2'>
                                    <Link href={notification.href} className='text-teal-600 hover:underline'>
                                        Vezi toate ({notification.count}) →
                                    </Link>
                                </li>
                            )}
                        </ul>
                    )}
                </li>
            );
        })}
    </ul>
);
