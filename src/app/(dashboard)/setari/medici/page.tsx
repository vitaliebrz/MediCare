import { Plus, Stethoscope } from 'lucide-react';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { getCategories } from '@/lib/actions/categories';
import { getDoctors } from '@/lib/actions/doctors';
import { PAGE_CLASS, PRIMARY_BUTTON_CLASS } from '@/lib/ui-classes';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { DoctorForm } from '@/components/settings/doctor-form';
import { DoctorCard } from '@/components/settings/doctor-card';

export default async function SetariMedici() {
    const [clinic, categories, doctors] = await Promise.all([
        getClinicSettings(),
        getCategories(),
        getDoctors(),
    ]);

    return (
        <div className={PAGE_CLASS}>
            <PageHeader
                clinicName={clinic?.clinicName}
                trail={[{ label: 'Setări', href: '/setari' }, { label: 'Medici' }]}
                title='Medici'
                action={
                    <DoctorForm
                        categories={categories}
                        trigger={<Button className={PRIMARY_BUTTON_CLASS}><Plus className='h-4 w-4' /> Medic nou</Button>}
                    />
                }
            />
            {doctors.length > 0 ? (
                <DoctorCard doctors={doctors} categories={categories} />
            ) : (
                <EmptyState icon={Stethoscope} title='Niciun medic încă' description='Adaugă medicii clinicii; fiecare primește o culoare în calendar.' />
            )}
        </div>
    );
}
