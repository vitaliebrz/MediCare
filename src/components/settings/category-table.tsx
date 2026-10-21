'use client'

import {
    Table,
    TableHead,
    TableCell,
    TableBody,
    TableRow,
    TableHeader
} from "@/components/ui/table";
import { checkCategoryUsage, deleteCategory } from "@/lib/actions/categories";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Category } from "@/lib/db/schema";
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useState } from "react";
import { toast } from '@/components/ui/toast'
import { formatDate } from '@/lib/format';
import { CLINIC_TIME_ZONE } from '@/lib/dashboard-period';
import { ICON_DELETE_BUTTON_CLASS, TABLE_HEAD_ROW_CLASS, TABLE_WRAPPER_CLASS } from '@/lib/ui-classes';

// Ziua (AAAA-LL-ZZ) în fusul clinicii. 'sv-SE' dă mereu formatul ISO, deci serverul și browserul
// afișează la fel (altfel limba browserului putea schimba textul și producea o eroare de hydration).
const clinicDay = (date: Date) => date.toLocaleDateString('sv-SE', { timeZone: CLINIC_TIME_ZONE });

interface CategoryTableProps {
    categories: Category[];
}

export const CategoryTable = ({ categories }: CategoryTableProps) => {
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);
    
    const handleDelete = async (id: string) => {
        setPendingId(id);
        try {
            const result = await deleteCategory(id);
            if (!result.success) {
                toast.add({
                    title: 'Ștergere eșuată',
                    description: result.error ?? 'Ceva nu a mers bine, încearcă mai târziu',
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
            setOpenId(null);

        }
    }

    const handleDeleteClick = async (id: string) => {
        setPendingId(id);
        try {
            const result = await checkCategoryUsage(id);
            if (!result.success) {
                toast.add({
                    title: 'Ștergere eșuată',
                    description: result.error ?? 'Ceva nu a mers bine, încearcă mai târziu',
                    type: 'error'
                })
            } else {
                setOpenId(id)
            }
        } catch {
            toast.add({
                title: 'Eroare de conexiune',
                description: 'Verifică internetul și încearcă din nou',
                type: 'error'
            })
        }
        finally {
            setPendingId(null);
        }

    }

    const categoryToDelete = categories.find((category) => category.id === openId);

    return (
        <div className={TABLE_WRAPPER_CLASS}>
            <Table>
                <TableHeader>
                    <TableRow className={TABLE_HEAD_ROW_CLASS}>
                        <TableHead>Denumire</TableHead>
                        <TableHead>Data creării</TableHead>
                        <TableHead>Acțiuni</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map((category) => (
                        <TableRow key={category.id}>
                            <TableCell className='font-medium'>{category.name}</TableCell>
                            <TableCell className='tabular-nums'>{formatDate(clinicDay(category.createdAt))}</TableCell>
                            <TableCell>
                                <Button className={ICON_DELETE_BUTTON_CLASS}
                                    title='Șterge'
                                    onClick={() => handleDeleteClick(category.id)}
                                    disabled={pendingId === category.id}
                                ><Trash2 /></Button>

                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Un singur dialog pentru tot tabelul, deschis pentru categoria aleasă */}
            <ConfirmDialog
                open={openId !== null}
                onOpenChange={(open) => { if (!open) setOpenId(null) }}
                title='Ștergeți categoria?'
                description={<>Această acțiune va șterge definitiv categoria: <span className="font-semibold">{categoryToDelete?.name}</span></>}
                pending={openId !== null && pendingId === openId}
                onConfirm={() => openId && handleDelete(openId)}
            />
        </div>

    )
}
