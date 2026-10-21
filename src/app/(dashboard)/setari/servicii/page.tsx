import { Plus, Wrench } from 'lucide-react';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { getServices } from '@/lib/actions/services';
import { getCategories } from '@/lib/actions/categories';
import { PAGE_CLASS, PRIMARY_BUTTON_CLASS } from '@/lib/ui-classes';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { ServiceForm } from '@/components/settings/service-form';
import { ServiceTable } from '@/components/settings/service-table';

export default async function SetariServicii() {
    const [clinic, services, categories] = await Promise.all([
        getClinicSettings(),
        getServices(),
        getCategories(),
    ]);
    const currency = clinic?.currency ?? 'MDL';
    const newServiceButton = (
        <ServiceForm
            trigger={<Button className={PRIMARY_BUTTON_CLASS}><Plus className='h-4 w-4' /> Serviciu nou</Button>}
            categories={categories}
            currency={currency}
        />
    );

    return (
        <div className={PAGE_CLASS}>
            <PageHeader
                clinicName={clinic?.clinicName}
                trail={[{ label: 'Setări', href: '/setari' }, { label: 'Servicii' }]}
                title='Servicii'
                action={newServiceButton}
            />
            {services.length > 0 ? (
                <ServiceTable services={services} categories={categories} currency={currency} />
            ) : (
                <EmptyState
                    icon={Wrench}
                    title='Niciun serviciu încă'
                    description={categories.length > 0
                        ? 'Adaugă serviciile clinicii, cu prețul și durata lor.'
                        : 'Creează întâi o categorie (Setări → Categorii), apoi adaugă serviciile.'}
                />
            )}
        </div>
    );
}
