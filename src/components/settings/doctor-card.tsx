'use client'
import { updateDoctor } from "@/lib/actions/doctors";
import { Doctors } from "@/lib/db/schema";
import { deleteDoctor } from "@/lib/actions/doctors";
import { Category } from "@/lib/db/schema";
import { doctorColor } from "@/lib/constants/doctor-colors";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { pillClass } from "@/lib/ui-classes";
import { DoctorForm } from "./doctor-form";
import { toast } from "@/components/ui/toast";
import { useState } from 'react';

interface DoctorCardProps {
    doctors: Doctors[];
    categories: Category[]
}

export const DoctorCard = ({ doctors, categories }: DoctorCardProps) => {

    const [pendingId, setPendingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
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
            setDeleteId(null);
        }
    }

    const doctorToDelete = doctors.find((doctor) => doctor.id === deleteId);
    const outlineButton = 'cursor-pointer border border-zinc-300 bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700';

    return (
        <div className="flex flex-col gap-4">
            {doctors.map((doctor) => (
                <div className={cn('group/item rounded-lg border bg-white p-4', doctor.active ? 'text-zinc-600' : 'text-zinc-400')} key={doctor.id}>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-3">
                                {/* „Nume Prenume”, ca în calendar, rapoarte și formulare */}
                                <h2 className={cn('text-lg font-semibold', doctor.active ? 'text-zinc-900' : 'text-zinc-500')}>Dr. {doctor.lastName} {doctor.firstName}</h2>
                                <span className={pillClass(doctor.active ? 'green' : 'neutral')}>{doctor.active ? 'Activ' : 'Inactiv'}</span>
                            </div>
                            <div className="flex items-center gap-2 xl:invisible xl:group-hover/item:visible xl:group-focus-within/item:visible">
                                <Button className={outlineButton}
                                    disabled={pendingId === doctor.id}
                                    onClick={() => handleToogleActive(doctor, !doctor.active)}>{doctor.active ? 'Dezactivează' : 'Activează'}</Button>
                                <DoctorForm trigger={<Button className={outlineButton} title='Editează'><Pencil /></Button>}
                                    initialData={doctor}
                                    categories={categories}
                                    key={doctor.id} />
                                <Button className={cn(outlineButton, 'hover:text-red-500')}
                                    title='Șterge'
                                    onClick={() => setDeleteId(doctor.id)}
                                    disabled={pendingId === doctor.id}><Trash2 /></Button>
                            </div>
                        </div>
                        <p className="text-sm">{categories.find((cat) => cat.id === doctor.categoryId)?.name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                            {doctor.phone && <p className="tabular-nums">{doctor.phone}</p>}
                            {doctor.email && <p>{doctor.email}</p>}
                            {doctor.hireDate && <p>În echipă din {formatDate(doctor.hireDate)}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: doctorColor.find((c) => c.value === doctor.color)?.hex }} />
                            <span className="text-sm">Culoare în calendar</span>
                        </div>
                    </div>
                </div>
            ))}

            {/* Confirmare înainte de ștergere, ca la pacienți, servicii și categorii */}
            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => { if (!open) setDeleteId(null) }}
                title='Ștergeți medicul?'
                description={<>
                    <span className="font-semibold">Dr. {doctorToDelete?.lastName} {doctorToDelete?.firstName}</span> va fi șters definitiv.
                    Dacă nu mai lucrează în clinică, dar vreți să-i păstrați istoricul, dezactivați-l.
                </>}
                pending={deleteId !== null && pendingId === deleteId}
                onConfirm={() => deleteId && handleDelete(deleteId)}
            />
        </div>
    )
}
