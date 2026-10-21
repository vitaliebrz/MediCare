import { z } from 'zod';

// Ce alerte vrea să vadă utilizatorul (Setări → Notificări). Câmpurile sunt cele din tabelul notification_settings.
export const notificationSettingsSchema = z.object({
    unconfirmedAppointments: z.boolean(),
    pendingAppointments: z.boolean(),
    oldDebts: z.boolean(),
    // Câmpurile numerice trimit un număr (register cu valueAsNumber); gol = NaN, respins de z.number
    debtDays: z.number({ error: 'Introdu un număr' }).int('Introdu un număr întreg').min(1, 'Minim 1 zi').max(365, 'Maxim 365 de zile'),
    incompleteData: z.boolean(),
    recall: z.boolean(),
    recallMonths: z.number({ error: 'Introdu un număr' }).int('Introdu un număr întreg').min(1, 'Minim 1 lună').max(36, 'Maxim 36 de luni'),
    birthdays: z.boolean(),
});
export type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

// Valorile pentru un utilizator care n-a salvat încă nimic (aceleași ca valorile implicite din tabel)
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsFormData = {
    unconfirmedAppointments: true,
    pendingAppointments: true,
    oldDebts: true,
    debtDays: 30,
    incompleteData: true,
    recall: true,
    recallMonths: 6,
    birthdays: true,
};
