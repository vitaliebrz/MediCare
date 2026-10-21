import { ClinicSettingsForm } from '@/components/settings/clinic-settings-form';
import { ClinicLogoUpload } from '@/components/settings/clinic-logo-upload';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { PAGE_CLASS } from '@/lib/ui-classes';
import { PageHeader } from '@/components/page-header';

export default async function SetariClinica() {
    const clinic = await getClinicSettings();
    return (
        <div className={PAGE_CLASS}>
            <PageHeader
                clinicName={clinic?.clinicName}
                trail={[{ label: 'Setări', href: '/setari' }, { label: 'Clinică' }]}
                title='Clinică'
                description='Datele clinicii apar în rapoarte și în fișele medicale (PDF).'
            />
            <ClinicLogoUpload logoUrl={clinic?.logoUrl ?? null} />
            <ClinicSettingsForm initialData={clinic} />
        </div>
    );
}
