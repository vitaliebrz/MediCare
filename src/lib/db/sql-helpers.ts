// Helperi SQL comuni pentru interogările de agregare (dashboard, rapoarte).
// Datele se compară ca zile în ora Chișinăului:
// - coloane timestamptz (paid_at, starts_at): (col at time zone TZ)::date
// - coloane timestamp fără fus (created_at, salvat în UTC de now()): (col at time zone 'UTC' at time zone TZ)::date

import { sql } from 'drizzle-orm';
import { CLINIC_TIME_ZONE } from '@/lib/dashboard-period';

export const TZ = sql.raw(`'${CLINIC_TIME_ZONE}'`);
export const localDate = (column: string) => sql.raw(`(${column} at time zone '${CLINIC_TIME_ZONE}')::date`);
export const localDateUtc = (column: string) => sql.raw(`(${column} at time zone 'UTC' at time zone '${CLINIC_TIME_ZONE}')::date`);

// Postgres întoarce sum()/count() ca text (numeric/bigint); le convertim la number
export const num = (value: unknown) => Number(value ?? 0);
