import { getClinicSettings } from "@/lib/actions/clinic-settings";
import { DoctorForm } from "@/components/settings/doctor-form";
import { Button } from '@/components/ui/button';
import { getCategories } from "@/lib/actions/categories";
import { DoctorCard } from "@/components/settings/doctor-card";
import { getDoctors } from "@/lib/actions/doctors";
export default async function SetariMeidic() {
    const [clinic, categories, doctors] = await Promise.all([
        getClinicSettings(),
        getCategories(),
        getDoctors(),
    ])
 
    return (
        <div className="p-8 flex flex-col gap-4">
                    <p className="text-slate-500 mt-2 ">{clinic?.clinicName ?? 'Clinica'}/Setari/Medici</p>
                    <div className='flex justify-between'>
                        <h1 className="text-2xl font-bold">Medici</h1>
                        <DoctorForm categories={categories} trigger={<Button className='bg-teal-500 hover:bg-teal-600 cursor-pointer'>+ Medic nou</Button>}></DoctorForm>
            </div>
            <DoctorCard doctors={doctors} categories={categories} />
        
        
                </div>
    );
}