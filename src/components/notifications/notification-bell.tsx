'use client';

import { Suspense, use, useState } from 'react';
import Link from 'next/link';
import { Bell, BellOff } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { AppNotification } from '@/lib/db/notification-queries';
import { NotificationList } from './notification-list';

const BUTTON_CLASS = 'relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900';

// Clopoțelul din bara de sus. Primește alertele ca Promise (pornit în layout, fără await):
// pagina se afișează imediat, iar clopoțelul își arată numărul când sosesc alertele.
export const NotificationBell = ({ notifications }: { notifications: Promise<AppNotification[]> }) => (
    // Până sosesc alertele: clopoțelul fără bulină (nu poate fi apăsat încă)
    <Suspense fallback={<span className={BUTTON_CLASS} aria-hidden><Bell className='h-5 w-5' /></span>}>
        <BellWithCount notifications={notifications} />
    </Suspense>
);

const BellWithCount = ({ notifications: promise }: { notifications: Promise<AppNotification[]> }) => {
    // use() citește valoarea Promise-ului; până atunci se vede fallback-ul din Suspense
    const notifications = use(promise);
    const [open, setOpen] = useState(false);
    const total = notifications.reduce((sum, notification) => sum + notification.count, 0);
    const label = total > 0 ? `Notificări: ${total} de rezolvat` : 'Notificări: nimic de rezolvat';

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className={BUTTON_CLASS} aria-label={label} title={label}>
                <Bell className='h-5 w-5' />
                {total > 0 && (
                    <span className='absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-500 px-1 text-[11px] font-semibold text-white tabular-nums'>
                        {total > 9 ? '9+' : total}
                    </span>
                )}
            </PopoverTrigger>
            <PopoverContent align='end' className='w-80 max-w-[calc(100vw-2rem)]'>
                <p className='font-semibold'>Notificări</p>
                {notifications.length > 0 ? (
                    <NotificationList notifications={notifications} compact onNavigate={() => setOpen(false)} />
                ) : (
                    <div className='flex flex-col items-center gap-2 py-6 text-center text-slate-500'>
                        <BellOff className='h-8 w-8 text-slate-300' aria-hidden />
                        Nimic de rezolvat acum.
                    </div>
                )}
                <Link
                    href='/setari/notificari'
                    onClick={() => setOpen(false)}
                    className='border-t pt-2 text-center text-sm text-teal-600 hover:underline'
                >
                    Toate alertele și setările
                </Link>
            </PopoverContent>
        </Popover>
    );
};
