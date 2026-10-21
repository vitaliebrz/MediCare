import { BellOff } from 'lucide-react';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { getNotifications, getNotificationSettings } from '@/lib/actions/notifications';
import { PAGE_CLASS } from '@/lib/ui-classes';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { NotificationList } from '@/components/notifications/notification-list';
import { NotificationSettingsForm } from '@/components/notifications/notification-settings-form';

// Alertele nu se trimit și nu se salvează: sunt calculate din date (vezi docs/plans/notificari-cont.md)
export default async function SetariNotificari() {
    const [clinic, notifications, settings] = await Promise.all([
        getClinicSettings(),
        getNotifications(),
        getNotificationSettings(),
    ]);

    return (
        <div className={PAGE_CLASS}>
            <PageHeader
                clinicName={clinic?.clinicName}
                trail={[{ label: 'Setări', href: '/setari' }, { label: 'Notificări' }]}
                title='Notificări'
                description='Alertele din clopoțel sunt calculate din datele clinicii și dispar singure când rezolvi cauza (confirmi programarea, se achită datoria...).'
            />

            <section className='flex max-w-2xl flex-col gap-3'>
                <h2 className='text-lg font-semibold'>Alerte active acum</h2>
                {notifications.length > 0
                    ? <NotificationList notifications={notifications} />
                    : <EmptyState icon={BellOff} title='Nimic de rezolvat' description='Nicio alertă activă pentru setările de mai jos.' />}
            </section>

            <section className='flex flex-col gap-3'>
                <div>
                    <h2 className='text-lg font-semibold'>Ce alerte vrei să vezi</h2>
                    <p className='text-sm text-slate-500'>Setările sunt doar ale contului tău; colegii își aleg propriile alerte.</p>
                </div>
                <NotificationSettingsForm initialData={settings} />
            </section>
        </div>
    );
}
