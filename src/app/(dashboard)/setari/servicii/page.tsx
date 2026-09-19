import { getClinicSettings } from "@/lib/actions/clinic-settings";
import { ServiceForm } from "@/components/settings/service-form";
import { Button } from '@/components/ui/button';
import { ServiceTable } from '@/components/settings/service-table'
import { getServices } from "@/lib/actions/services";
import { getCategories } from "@/lib/actions/categories";

export default async function SetariServicii() {
    const [clinic, services, categories] = await Promise.all([
        getClinicSettings(),
        getServices(),
        getCategories(),
    ])
    return (
        <div className="p-8 flex flex-col gap-4">
            <p className="text-slate-500 mt-2">{clinic?.clinicName ?? 'Clinica'}/Setari/Servicii</p>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Servicii</h1>
                <ServiceForm
                    trigger={<Button className='bg-teal-500 hover:bg-teal-600 cursor-pointer'>+ Serviciu nou</Button>}
                    categories={categories}
                    currency={clinic?.currency ?? 'MDL'}
                    />
            </div>
            <ServiceTable services={services} categories={categories} currency={clinic?.currency?? 'MDL'}></ServiceTable>

        </div>
    );
}