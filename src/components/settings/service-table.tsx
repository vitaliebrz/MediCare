'use client'

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import type { Category, Service } from '@/lib/db/schema';
import { deleteService, updateService } from '@/lib/actions/services';
import { formatMoney } from '@/lib/format';
import { ICON_BUTTON_CLASS, ICON_DELETE_BUTTON_CLASS, TABLE_HEAD_ROW_CLASS, TABLE_WRAPPER_CLASS, pillClass } from '@/lib/ui-classes';
import { ServiceForm } from './service-form';

interface ServiceTableProps {
    services: Service[];
    categories: Category[];
    currency: string;
}

export const ServiceTable = ({ services, categories, currency }: ServiceTableProps) => {
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleToggleActive = async (service: Service, checked: boolean) => {
        setPendingId(service.id);
        try {
            const result = await updateService(service.id, {
                name: service.name,
                categoryId: service.categoryId,
                description: service.description ?? undefined,
                price: Number(service.price),
                durationMinutes: service.durationMinutes,
                active: checked,
            });
            if (!result.success) {
                toast.add({ title: 'Actualizare eșuată', description: 'Statusul serviciului nu a putut fi modificat', type: 'error' });
            }
        } catch {
            toast.add({ title: 'Eroare de conexiune', description: 'Verifică internetul și încearcă din nou', type: 'error' });
        } finally {
            setPendingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        setPendingId(id);
        try {
            const result = await deleteService(id);
            if (!result.success) {
                toast.add({ title: 'Ștergere eșuată', description: 'Nu s-a putut șterge serviciul. Încearcă din nou.', type: 'error' });
            }
        } catch {
            toast.add({ title: 'Eroare de conexiune', description: 'Verifică internetul și încearcă din nou', type: 'error' });
        } finally {
            setPendingId(null);
            setDeleteId(null);
        }
    };

    const serviceToDelete = services.find((service) => service.id === deleteId);

    return (
        <div className={TABLE_WRAPPER_CLASS}>
            <Table>
                <TableHeader>
                    <TableRow className={TABLE_HEAD_ROW_CLASS}>
                        <TableHead>Serviciu</TableHead>
                        <TableHead>Categorie</TableHead>
                        <TableHead>Durată</TableHead>
                        <TableHead className='text-right'>Preț</TableHead>
                        <TableHead>Activ</TableHead>
                        <TableHead>Acțiuni</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {services.map((service) => (
                        <TableRow key={service.id}>
                            <TableCell className='min-w-48 max-w-72 whitespace-normal'>
                                <div className='font-medium'>{service.name}</div>
                                {service.description && (
                                    <div className='line-clamp-2 text-sm text-muted-foreground' title={service.description}>{service.description}</div>
                                )}
                            </TableCell>
                            <TableCell>
                                <span className={pillClass('neutral')}>{categories.find((cat) => cat.id === service.categoryId)?.name ?? '—'}</span>
                            </TableCell>
                            <TableCell className='tabular-nums'>{service.durationMinutes} min</TableCell>
                            <TableCell className='text-right font-semibold tabular-nums whitespace-nowrap'>{formatMoney(service.price, currency)}</TableCell>
                            <TableCell>
                                <Switch
                                    checked={service.active}
                                    disabled={pendingId === service.id}
                                    onCheckedChange={(checked) => handleToggleActive(service, checked)}
                                    aria-label={service.active ? 'Dezactivează serviciul' : 'Activează serviciul'}
                                    className='data-checked:bg-teal-500'
                                />
                            </TableCell>
                            <TableCell>
                                <div className='flex gap-2'>
                                    <ServiceForm
                                        trigger={<Button className={ICON_BUTTON_CLASS} title='Editează'><Pencil /></Button>}
                                        initialData={service}
                                        categories={categories}
                                        currency={currency}
                                    />
                                    <Button
                                        className={ICON_DELETE_BUTTON_CLASS}
                                        title='Șterge'
                                        disabled={pendingId === service.id}
                                        onClick={() => setDeleteId(service.id)}
                                    >
                                        <Trash2 />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Un singur dialog pentru tot tabelul, ca la pacienți și categorii */}
            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => { if (!open) setDeleteId(null) }}
                title='Ștergeți serviciul?'
                description={<>
                    Serviciul <span className='font-semibold'>{serviceToDelete?.name}</span> va fi șters definitiv.
                    Dacă vreți doar să nu mai apară la programări, dezactivați-l.
                </>}
                pending={deleteId !== null && pendingId === deleteId}
                onConfirm={() => deleteId && handleDelete(deleteId)}
            />
        </div>
    );
};
