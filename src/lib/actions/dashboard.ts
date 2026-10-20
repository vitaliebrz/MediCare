'use server';

import { getCurrentUser } from '@/lib/auth/current-user';
import { getDashboardDataForClinic } from '@/lib/db/dashboard-queries';

// clinicId vine DOAR din sesiune, niciodată din browser
export async function getDashboardData(periodKey: string | undefined) {
    const { clinicId } = await getCurrentUser();
    return getDashboardDataForClinic(clinicId, periodKey);
}
