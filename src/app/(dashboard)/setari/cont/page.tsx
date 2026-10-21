import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { getCurrentUser } from '@/lib/auth/current-user';
import { ROLE_LABELS } from '@/lib/constants/user-roles';
import { PAGE_CLASS } from '@/lib/ui-classes';
import { PageHeader } from '@/components/page-header';
import { ProfileForm } from '@/components/settings/profile-form';
import { PasswordForm } from '@/components/settings/password-form';
import { SecurityCard } from '@/components/settings/security-card';

// Contul utilizatorului logat (doar al lui; gestionarea echipei nu e încă în aplicație)
export default async function SetariCont() {
    const [user, clinic] = await Promise.all([getCurrentUser(), getClinicSettings()]);

    return (
        <div className={PAGE_CLASS}>
            <PageHeader
                clinicName={clinic?.clinicName}
                trail={[{ label: 'Setări', href: '/setari' }, { label: 'Cont' }]}
                title='Cont'
                description='Datele tale de profil și parola de acces.'
            />
            <div className='flex max-w-xl flex-col gap-4'>
                <ProfileForm
                    initialData={{ fullName: user.fullName, phone: user.phone ?? '' }}
                    email={user.email}
                    roleLabel={ROLE_LABELS[user.role]}
                    clinicName={clinic?.clinicName ?? 'Clinica'}
                />
                <PasswordForm />
                <SecurityCard />
            </div>
        </div>
    );
}
