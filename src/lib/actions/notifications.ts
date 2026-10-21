'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { clinicSettings, notificationSettings } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth/current-user';
import { todayInClinic } from '@/lib/dashboard-period';
import { getNotificationsForUser } from '@/lib/db/notification-queries';
import {
    DEFAULT_NOTIFICATION_SETTINGS,
    notificationSettingsSchema,
    type NotificationSettingsFormData,
} from '@/lib/validations/notifications';

// Setările utilizatorului logat; fără rând salvat = valorile implicite (toate alertele active)
export async function getNotificationSettings(): Promise<NotificationSettingsFormData> {
    const { id: userId } = await getCurrentUser();
    const [row] = await db.select().from(notificationSettings).where(eq(notificationSettings.userId, userId)).limit(1);
    if (!row) return DEFAULT_NOTIFICATION_SETTINGS;
    // Doar câmpurile din formular (fără userId / updatedAt): obiectul ajunge în browser
    return {
        unconfirmedAppointments: row.unconfirmedAppointments,
        pendingAppointments: row.pendingAppointments,
        oldDebts: row.oldDebts,
        debtDays: row.debtDays,
        incompleteData: row.incompleteData,
        recall: row.recall,
        recallMonths: row.recallMonths,
        birthdays: row.birthdays,
    };
}

// Alertele active pentru utilizatorul logat. clinicId și userId vin DOAR din sesiune.
export async function getNotifications() {
    const { clinicId } = await getCurrentUser();
    const [settings, [clinic]] = await Promise.all([
        getNotificationSettings(),
        db.select({ currency: clinicSettings.currency }).from(clinicSettings).where(eq(clinicSettings.clinicId, clinicId)).limit(1),
    ]);
    return getNotificationsForUser(clinicId, settings, todayInClinic(), clinic?.currency ?? 'MDL');
}

export async function updateNotificationSettings(data: NotificationSettingsFormData) {
    const { id: userId } = await getCurrentUser();
    const result = notificationSettingsSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: 'Datele introduse nu sunt valide. Verificați câmpurile completate.' };
    }

    // Upsert: primul „Salvează” creează rândul, următoarele îl actualizează
    await db
        .insert(notificationSettings)
        .values({ ...result.data, userId })
        .onConflictDoUpdate({
            target: notificationSettings.userId,
            set: { ...result.data, updatedAt: new Date() },
        });

    // 'layout': clopoțelul din bara de sus (în layout) se recalculează pe orice pagină
    revalidatePath('/', 'layout');
    return { success: true };
}
