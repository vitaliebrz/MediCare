'use client'

import {
    Table,
    TableHead,
    TableCell,
    TableBody,
    TableRow,
    TableHeader
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import type { Service, Category } from '@/lib/db/schema'
import { updateService, deleteService } from "@/lib/actions/services";
import { ServiceForm } from "./service-form";
import { toast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

interface ServiceTableProps {
    services: Service[];
    categories: Category[];
    currency: string;

}



export const ServiceTable = ({ services, categories, currency }: ServiceTableProps) => {
    const [pendingId, setPendingId] = useState<string | null>(null);
    const handleToogleActive = async (service: Service, checked: boolean) => {
        setPendingId(service.id)
        try {
            const result = await updateService(service.id, {
                name: service.name,
                category: service.category ,
                description: service.description ?? undefined,
                price: Number(service.price),
                durationMinutes: service.durationMinutes,
                active: checked,
            });
            if (!result.success) {
                toast.add({
                    title: 'Actualizare eșuată',
                    description: 'Statusul serviciului nu a putut fi modificat',
                    type: 'error'
                })
            }

        }
        catch {
            toast.add({
                title: 'Eroare de conexiune',
                description: 'Verifică internetul și încearcă din nou',
                type: 'error',
            })
        } finally {
            setPendingId(null);
        }
    }
    const handleDelete = async (id: string) => {
        setPendingId(id);
        try {
            const result = await deleteService(id);
            if (!result.success) {
                toast.add({
                    title: 'Ștergere eșuată',
                    description: 'Nu s-a putut șterge serviciul. Încearcă din nou.',
                    type: 'error'
                })
            }
        } catch {
            toast.add({
                title: 'Eroare de conexiune',
                description: 'Verifică internetul și încearcă din nou',
                type: 'error',
            })
        }
        finally {
            setPendingId(null)
        }

    }


    return (
        <div className="overflow-hidden rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-zinc-300 hover:bg-zinc-300">
                        <TableHead>Serviciu</TableHead>
                        <TableHead>Categorie</TableHead>
                        <TableHead>Durată</TableHead>
                        <TableHead>Preț</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Acțiuni</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {services.map((service) => (
                        <TableRow key={service.id}>
                            <TableCell className="max-w-50">
                                <div> {service.name} </div>
                                <div className="truncate text-sm text-muted-foreground line-clamp-2" title={service.description ?? ''}> {service.description}</div>
                            </TableCell>
                            <TableCell className="md:max-w-30"> <span className="bg-zinc-500/20 px-2 py-1 rounded-xl text-xs">{service.category}</span></TableCell>
                            <TableCell>{service.durationMinutes} min</TableCell>
                            <TableCell className="font-semibold">{service.price} {currency}</TableCell>
                            <TableCell>
                                <Switch checked={service.active}
                                    disabled={pendingId === service.id}
                                    onCheckedChange={(checked) => handleToogleActive(service, checked)}
                                    className='data-checked:bg-teal-500' />
                            </TableCell>
                            <TableCell className="flex flex-row gap-4">
                                <ServiceForm trigger={<Button className='bg-transparent text-zinc-500 cursor-pointer md:hover:bg-teal-500/50 md:hover:text-white'
                                ><Pencil /></Button>}
                                    initialData={service}
                                    categories={categories}
                                    currency={currency}
                                />

                                <Button onClick={() => handleDelete(service.id)}
                                    disabled={pendingId === service.id} className='cursor-pointer md:text-zinc-500  bg-red-200 text-red-500 md:bg-transparent hover:bg-red-200 md:hover:text-red-500'><Trash2 /></Button>
                            </TableCell>
                        </TableRow>

                    ))}
                </TableBody>
            </Table>
        </div>
    )
}