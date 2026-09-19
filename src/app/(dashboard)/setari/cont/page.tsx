import { getClinicSettings } from '@/lib/actions/clinic-settings';

export default async function SetariCont() {
    const result = await getClinicSettings();
    return (
        <div className="p-8">
            <p className="text-slate-500 mt-2">{result?.clinicName ?? 'Clinica'}/Setari/Cont</p>
            <h1 className="text-2xl font-bold">Cont</h1>

        </div>
    );
}