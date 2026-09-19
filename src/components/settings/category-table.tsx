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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogMedia,
    AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { useState } from "react";
import { toast } from '@/components/ui/toast'

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

    return (
        <div className="overflow-hidden rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-zinc-300 hover:bg-zinc-300">
                        <TableHead>Denumire</TableHead>
                        <TableHead>Data creării</TableHead>
                        <TableHead>Acțiuni</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map((category) => (
                        <TableRow key={category.id}>
                            <TableCell>{category.name}</TableCell>
                            <TableCell>{category.createdAt.toLocaleDateString('ro-MD', { timeZone: 'Europe/Chisinau' })} {category.createdAt.toLocaleTimeString('ro-MD', { timeZone: 'Europe/Chisinau' })}</TableCell>
                            <TableCell>
                                <Button className='cursor-pointer md:text-zinc-500  bg-red-200 text-red-500 md:bg-transparent hover:bg-red-200 md:hover:text-red-500'
                                    onClick={() => handleDeleteClick(category.id)}
                                    disabled={pendingId === category.id}
                                ><Trash2 /></Button>
                                <AlertDialog open={openId === category.id} onOpenChange={(open) => { if (!open) setOpenId(null) }}>
                                    <AlertDialogContent size="sm">
                                        <AlertDialogHeader>
                                            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                                                <Trash2 />
                                            </AlertDialogMedia>
                                            <AlertDialogTitle>Ștergeți categoria?</AlertDialogTitle>
                                            <AlertDialogDescription>Această acțiune va șterge definitiv categoria: <span className="font-semibold">{category.name}</span></AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel variant={'outline'}>Anulează</AlertDialogCancel>
                                            <AlertDialogAction variant="destructive" onClick={() => handleDelete(category.id)} disabled={pendingId === category.id}>Ștergeți</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

    )
}
