'use client'

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import { CLINIC_TIME_ZONE, todayInClinic } from '@/lib/dashboard-period';
import { layoutOverlaps, minutesToTime, timeToMinutes } from '@/lib/calendar';
import type { CalendarAppointment } from '@/lib/actions/appointments';
import { AppointmentBlock } from './appointment-block';

const HOUR_HEIGHT = 64; // px pentru o oră
const PX_PER_MINUTE = HOUR_HEIGHT / 60;
const SLOT_MINUTES = 15; // click-ul pe grilă se rotunjește la 15 minute

// O coloană a grilei: o zi (vizualizarea Săptămână) sau un medic (vizualizarea Zi)
export interface CalendarColumn {
    key: string;
    date: string;
    // undefined = toate programările zilei; null = doar cele fără medic; id = doar ale acelui medic
    doctorId?: string | null;
    label: string;
    sublabel?: string;
    href?: string; // click pe antet (ex. din Săptămână spre ziua respectivă)
    color?: string;
    isToday?: boolean;
}

interface CalendarGridProps {
    columns: CalendarColumn[];
    appointments: CalendarAppointment[];
    startMinutes: number; // prima oră afișată, în minute de la miezul nopții
    endMinutes: number;
    onSlotClick: (column: CalendarColumn, time: string) => void;
    onAppointmentClick: (appointment: CalendarAppointment) => void;
}

export const CalendarGrid = ({ columns, appointments, startMinutes, endMinutes, onSlotClick, onAppointmentClick }: CalendarGridProps) => {
    const now = useClinicNow();
    const hours = Array.from({ length: (endMinutes - startMinutes) / 60 }, (_, index) => startMinutes + index * 60);
    const height = (endMinutes - startMinutes) * PX_PER_MINUTE;
    const nowMinutes = now ? timeToMinutes(now.time) : null;
    const showNow = nowMinutes !== null && nowMinutes >= startMinutes && nowMinutes <= endMinutes;

    const handleColumnClick = (event: React.MouseEvent<HTMLDivElement>, column: CalendarColumn) => {
        // Poziția click-ului în coloană -> minute -> rotunjit în jos la 15 min
        const offset = event.clientY - event.currentTarget.getBoundingClientRect().top;
        const minutes = startMinutes + Math.floor(offset / PX_PER_MINUTE / SLOT_MINUTES) * SLOT_MINUTES;
        onSlotClick(column, minutesToTime(Math.min(minutes, endMinutes - SLOT_MINUTES)));
    };

    return (
        // Grila se derulează în interiorul cardului (pe telefon și orizontal); antetul și orele rămân fixe
        <div className='max-h-[calc(100dvh-15rem)] overflow-auto rounded-md border bg-white dark:bg-slate-950'>
            <div
                className='grid min-w-fit'
                style={{ gridTemplateColumns: `3.5rem repeat(${columns.length}, minmax(${columns.length > 3 ? '7.5rem' : '11rem'}, 1fr))` }}
            >
                {/* Antet */}
                <div className='sticky top-0 left-0 z-30 border-b bg-white dark:bg-slate-950' />
                {columns.map((column) => {
                    const content = (
                        <>
                            <span className='flex items-center justify-center gap-1.5 text-sm font-medium'>
                                {column.color && <span className='h-2 w-2 shrink-0 rounded-full' style={{ backgroundColor: column.color }} />}
                                <span className='truncate'>{column.label}</span>
                            </span>
                            {column.sublabel && <span className='block text-xs text-slate-500'>{column.sublabel}</span>}
                        </>
                    );
                    const className = cn(
                        'sticky top-0 z-20 block border-b border-l bg-white px-2 py-2 text-center dark:bg-slate-950',
                        column.isToday && 'text-teal-600',
                    );
                    return column.href
                        ? <Link key={column.key} href={column.href} className={cn(className, 'hover:bg-slate-50 dark:hover:bg-slate-900')}>{content}</Link>
                        : <div key={column.key} className={className}>{content}</div>;
                })}

                {/* Coloana orelor */}
                <div className='sticky left-0 z-10 bg-white dark:bg-slate-950' style={{ height }}>
                    {hours.map((hour) => (
                        <span
                            key={hour}
                            className='absolute right-2 -translate-y-1/2 text-xs tabular-nums text-slate-400 first:translate-y-0'
                            style={{ top: (hour - startMinutes) * PX_PER_MINUTE }}
                        >
                            {minutesToTime(hour)}
                        </span>
                    ))}
                </div>

                {/* Coloanele cu programări */}
                {columns.map((column) => {
                    const items = appointments.filter((appointment) =>
                        appointment.date === column.date
                        && (column.doctorId === undefined || appointment.doctorId === column.doctorId));
                    const layout = layoutOverlaps(items.map((appointment) => {
                        const start = timeToMinutes(appointment.time);
                        return { id: appointment.id, start, end: start + appointment.durationMinutes };
                    }));

                    return (
                        <div
                            key={column.key}
                            className={cn('relative border-l cursor-pointer', column.isToday && 'bg-teal-50/30 dark:bg-teal-950/20')}
                            style={{ height }}
                            onClick={(event) => handleColumnClick(event, column)}
                        >
                            {/* Linii: pline la ore, punctate la jumătate de oră */}
                            {hours.map((hour) => (
                                <div key={hour} className='pointer-events-none absolute inset-x-0' style={{ top: (hour - startMinutes) * PX_PER_MINUTE, height: HOUR_HEIGHT }}>
                                    <div className='h-1/2 border-t border-slate-100 dark:border-slate-800' />
                                    <div className='h-1/2 border-t border-dashed border-slate-100 dark:border-slate-800' />
                                </div>
                            ))}

                            {items.map((appointment) => {
                                const start = timeToMinutes(appointment.time);
                                const end = Math.min(start + appointment.durationMinutes, 24 * 60);
                                const slot = layout.get(appointment.id) ?? { column: 0, columns: 1 };
                                return (
                                    <AppointmentBlock
                                        key={appointment.id}
                                        appointment={appointment}
                                        onClick={() => onAppointmentClick(appointment)}
                                        style={{
                                            top: (start - startMinutes) * PX_PER_MINUTE + 1,
                                            height: Math.max((end - start) * PX_PER_MINUTE - 2, 18),
                                            left: `calc(${(slot.column / slot.columns) * 100}% + 2px)`,
                                            width: `calc(${100 / slot.columns}% - 4px)`,
                                        }}
                                    />
                                );
                            })}

                            {showNow && now?.date === column.date && (
                                <div className='pointer-events-none absolute inset-x-0 z-10 border-t-2 border-red-500' style={{ top: (nowMinutes - startMinutes) * PX_PER_MINUTE }}>
                                    <span className='absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-red-500' />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Ziua și ora curentă în ora Chișinăului, actualizate la fiecare 30 de secunde.
// Pe server (și la hidratare) e null, ca HTML-ul de pe server să coincidă cu primul render din browser.
function subscribe(onChange: () => void) {
    const id = setInterval(onChange, 30_000);
    return () => clearInterval(id);
}
const getNowKey = () => `${todayInClinic()} ${new Date().toLocaleTimeString('en-GB', { timeZone: CLINIC_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`;

function useClinicNow() {
    const key = useSyncExternalStore(subscribe, getNowKey, () => null);
    if (!key) return null;
    const [date, time] = key.split(' ');
    return { date, time };
}
