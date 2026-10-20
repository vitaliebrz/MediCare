'use client'

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Doctors } from '@/lib/db/schema';
import type { CalendarView, CalendarViewKind } from '@/lib/calendar';

const ALL = 'toti';

// Link-ul către o anumită vizualizare a calendarului; valorile implicite nu apar în URL
export function calendarHref({ view, date, doctorId }: { view: CalendarViewKind; date?: string; doctorId?: string }) {
    const params = new URLSearchParams();
    if (view === 'zi') params.set('vedere', 'zi');
    if (date) params.set('data', date);
    if (doctorId) params.set('medic', doctorId);
    const query = params.toString();
    return query ? `/programari?${query}` : '/programari';
}

interface CalendarToolbarProps {
    calendar: CalendarView;
    doctorId?: string;
    doctors: Doctors[];
    onNewAppointment: () => void;
}

export const CalendarToolbar = ({ calendar, doctorId, doctors, onNewAppointment }: CalendarToolbarProps) => {
    const router = useRouter();
    const { view } = calendar;

    return (
        <div className='flex flex-wrap items-center gap-2'>
            <div className='flex items-center gap-1'>
                <Link href={calendarHref({ view, date: calendar.previous, doctorId })} aria-label='Înapoi' className={buttonVariants({ variant: 'outline', size: 'icon' })}>
                    <ChevronLeft />
                </Link>
                {/* „Azi” = fără dată în URL -> pagina folosește ziua curentă */}
                <Link href={calendarHref({ view, doctorId })} className={buttonVariants({ variant: 'outline' })}>Azi</Link>
                <Link href={calendarHref({ view, date: calendar.next, doctorId })} aria-label='Înainte' className={buttonVariants({ variant: 'outline', size: 'icon' })}>
                    <ChevronRight />
                </Link>
            </div>
            <h2 className='text-lg font-semibold first-letter:uppercase'>{calendar.title}</h2>

            <div className='ml-auto flex flex-wrap items-center gap-2'>
                <div className='flex rounded-lg border p-0.5' role='group' aria-label='Vizualizare'>
                    {([['zi', 'Zi'], ['saptamana', 'Săptămână']] as const).map(([value, label]) => (
                        <Link
                            key={value}
                            href={calendarHref({ view: value, date: calendar.date, doctorId })}
                            aria-current={view === value ? 'page' : undefined}
                            className={cn(
                                'rounded-md px-3 py-1 text-sm',
                                view === value ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                            )}
                        >
                            {label}
                        </Link>
                    ))}
                </div>

                <Select
                    value={doctorId ?? ALL}
                    onValueChange={(value) => router.push(calendarHref({ view, date: calendar.date, doctorId: value && value !== ALL ? value : undefined }))}
                >
                    <SelectTrigger className='w-44 cursor-pointer'>
                        <SelectValue>
                            {(() => {
                                const doctor = doctors.find((item) => item.id === doctorId);
                                return doctor ? `Dr. ${doctor.lastName}` : 'Toți medicii';
                            })()}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Toți medicii</SelectItem>
                        {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>Dr. {doctor.lastName} {doctor.firstName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button className='bg-teal-500 hover:bg-teal-600 cursor-pointer gap-2' onClick={onNewAppointment}>
                    <Plus className='h-4 w-4' /> Programare nouă
                </Button>
            </div>
        </div>
    );
};
