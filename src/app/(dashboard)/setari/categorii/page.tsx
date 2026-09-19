import { getClinicSettings } from '@/lib/actions/clinic-settings';
import { Button } from '@/components/ui/button';
import { CategoryForm } from '@/components/settings/category-form';
import { CategoryTable } from '@/components/settings/category-table';
import { getCategories } from '@/lib/actions/categories';


export default async function SetariCategorii() {
    const [clinic, categories] = await Promise.all([
        getClinicSettings(),
        getCategories(),
    ])
    return (
        <div className="p-8 flex flex-col gap-4">
            <p className="text-slate-500 mt-2 ">{clinic?.clinicName ?? 'Clinica'}/Setari/Categorii</p>
            <div className='flex justify-between'>
                <h1 className="text-2xl font-bold">Categorii</h1>
                <CategoryForm trigger={<Button className='bg-teal-500 hover:bg-teal-600 cursor-pointer'>+ Categorie nouă</Button>}></CategoryForm>
            </div>
            <CategoryTable categories={categories}></CategoryTable>


        </div>
    );
}