'use client'
import { updateDoctor } from "@/lib/actions/doctors";
import { Doctors } from "@/lib/db/schema";
import { deleteDoctor } from "@/lib/actions/doctors";
import { Category } from "@/lib/db/schema";
import { doctorColor } from "@/lib/constants/doctor-colors";
import { Button } from "@/components/ui/button";
import { Pencil } from 'lucide-react';
import { Trash } from 'lucide-react';
import { DoctorForm } from "./doctor-form";
import { toast } from "@/components/ui/toast";
import { useState } from 'react';

interface DoctorCardProps {
    doctors: Doctors[];
    categories: Category[]
}

export const DoctorCard = ({ doctors, categories }: DoctorCardProps) => {

    const [pendingId, setPendingId] = useState<string | null>(null);
    const handleToogleActive = async (doctor: Doctors, checked: boolean) => {
        setPendingId(doctor.id);
        try {
            const result = await updateDoctor(doctor.id, {
                firstName: doctor.firstName,
                lastName: doctor.lastName,
                categoryId: doctor.categoryId,
                phone: doctor.phone ?? undefined,
                hireDate: doctor.hireDate ?? undefined,
                email: doctor.email ?? undefined,
                color: doctor.color,
                active: checked,
            });
            if (!result.success) {
                toast.add({
                    title: 'Actualizare eșuată',
                    description: 'Statusul medicului nu a putut fi modificat',
                    type: 'error'
                })
            }
        } catch {
            toast.add({
                title: 'Eroare de conexiune',
                description: 'Verifică internetul și încearcă din nou',
                type: 'error'
            })
        } finally {
            setPendingId(null);
        }
    }

    const handleDelete = async (id: string) => {
        setPendingId(id);
        try {
            const result = await deleteDoctor(id);
            if (!result.success) {
                toast.add({
                    title: 'Ștergere eșuată',
                    description: 'Nu s-a putut șterge medicul. Încearcă din nou.',
                    type: 'error',
                })
            }
        } catch {
            toast.add({
                title: 'Eroare de conexiune',
                description: 'Verifică internetul și încearcă din nou',
                type: 'error',
            })
        } finally {
            setPendingId(null);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {doctors.map((doctor) => (
                <div className={` border-2 p-4 rounded-xl ${doctor.active ? 'border-zinc-300 text-zinc-600' : 'border-zinc-200/70 text-zinc-500/50'}`} key={doctor.id}>
                    <div className="flex flex-col gap-2 group/item">
                        <div>

                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex gap-4">
                                <h2 className={`font-medium text-xl ${!doctor.active ? 'text-zinc-500' : ''}`}>Dr. {doctor.firstName} {doctor.lastName}</h2>
                                {doctor.active ?
                                    (<span className="px-3 py-1 rounded-full bg-teal-500/10 flex items-center gap-2 w-fit text-xs text-teal-600 font-medium"><div className="h-1.5 w-1.5 rounded-full bg-teal-500"></div>Activ</span>)
                                    : (<span className="px-3 py-1 rounded-full bg-zinc-500/10 flex items-center gap-2 w-fit text-xs  font-medium"><div className="h-1.5 w-1.5 rounded-full bg-zinc-300"></div>Inactiv</span>)
                                }
                            </div>
                            <div className="group/edit flex items-center gap-2 xl:invisible xl:group-hover/item:visible">
                                <Button className='text-zinc-500 border border-zinc-300 bg-white group-hover/edit:text-zinc-700 hover:bg-zinc-100'
                                    disabled={pendingId === doctor.id}
                                    onClick={() => handleToogleActive(doctor, !doctor.active)}>{doctor.active ? 'Dezactivează' : 'Activează'}</Button>
                                <DoctorForm trigger={<Button className='text-zinc-500 border border-zinc-300 bg-white group-hover/edit:text-zinc-700 hover:bg-zinc-100' > <Pencil /></Button>}
                                    initialData={doctor}
                                    categories={categories}
                                    key={doctor.id} />
                                <Button className='text-zinc-500 border border-zinc-300 bg-white group-hover/edit:text-red-400 hover:bg-zinc-100'
                                    onClick={() => handleDelete(doctor.id)}
                                    disabled={pendingId === doctor.id}> <Trash /></Button>

                            </div>
                        </div>
                        <p className="text-sm">{categories.find((cat) => cat.id === doctor.categoryId)?.name}</p>
                        <div className="flex gap-4 text-sm">
                            <p className={`${!doctor.phone ? 'hidden' : 'block'}`}>{doctor.phone}</p>
                            <p className={`${!doctor.email ? 'hidden' : 'block'}`}>{doctor.email}</p>
                            <p className={`${!doctor.hireDate ? 'hidden' : 'block'}`}>În echipă din {doctor.hireDate}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full `} style={{ backgroundColor: doctorColor.find((c) => c.value === doctor.color)?.hex }}> </div>
                            <span className="text-sm">Culoare în calendar</span>
                        </div>
                    </div>

                </div>
            ))}

        </div>
    )
}