import { ChartBarStacked, Plus } from 'lucide-react';
import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { getCategories } from '@/lib/actions/categories';
import { PAGE_CLASS, PRIMARY_BUTTON_CLASS } from '@/lib/ui-classes';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { CategoryForm } from '@/components/settings/category-form';
import { CategoryTable } from '@/components/settings/category-table';

export default async function SetariCategorii() {
    const [clinic, categories] = await Promise.all([
        getClinicSettings(),
        getCategories(),
    ]);

    return (
        <div className={PAGE_CLASS}>
            <PageHeader
                clinicName={clinic?.clinicName}
                trail={[{ label: 'Setări', href: '/setari' }, { label: 'Categorii' }]}
                title='Categorii'
                action={<CategoryForm trigger={<Button className={PRIMARY_BUTTON_CLASS}><Plus className='h-4 w-4' /> Categorie nouă</Button>} />}
            />
            {categories.length > 0 ? (
                <CategoryTable categories={categories} />
            ) : (
                <EmptyState icon={ChartBarStacked} title='Nicio categorie încă' description='Categoriile grupează serviciile și medicii (ex. Terapie, Chirurgie, Ortodonție).' />
            )}
        </div>
    );
}
