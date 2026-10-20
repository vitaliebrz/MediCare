import { ClinicSettingsForm } from '@/components/settings/clinic-settings-form'
import { ClinicLogoUpload } from '@/components/settings/clinic-logo-upload';
import { getClinicSettings } from '@/lib/actions/clinic-settings';


export default async function SetariClinica() {
    const result = await getClinicSettings()
    return (
        <div className="p-8 flex flex-col gap-4">

                <p className="text-slate-500 mt-2">{result?.clinicName ??  'Clinica' }/Setari/Clinică</p>
                <h1 className="text-2xl font-bold">Informații clinică</h1>
                <ClinicLogoUpload logoUrl={result?.logoUrl ?? null} />
                <ClinicSettingsForm initialData={result} />



        </div>
    );
}
