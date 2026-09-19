'use client'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from "@/components/ui/dialog"
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, type CategoryFormData } from "@/lib/validations/categories";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { createCategory } from "@/lib/actions/categories";
import { Loader2 } from 'lucide-react';
import { Check } from 'lucide-react';




interface CategoryFormProps {
    trigger: React.ReactElement;
}

export const CategoryForm = ({ trigger }: CategoryFormProps) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(categorySchema) as any,
        defaultValues: {
            name: '',
        },
    })
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [open, setOpen] = useState(false);
    const onSubmit = async (data: CategoryFormData) => {
        setLoading(true);
        setErrorMessage('');
        const result = await createCategory(data);
        if (result.success) {
            setSuccess(true);
            setOpen(false);
            reset()

        } else {
            setErrorMessage(result.error ?? '');
        }
        setLoading(false);
    }
    const onCancel = () => {
        setOpen(false);
        reset()
    }
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={trigger} />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Categorie nouă</DialogTitle>
                    <DialogDescription>Adaugă o categorie nouă pentru servicii</DialogDescription>
                </DialogHeader>


                <form onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-4"
                >

                    <div className="flex flex-col gap-2">

                        <Label htmlFor="name">Nume categorie</Label>
                        <Input
                            type="text"
                            id="name"
                            {...register('name')}
                            placeholder="ex: Profilaxie"></Input>
                        {errors.name && (
                            <p className="text-red-500">{errors.name?.message}</p>
                        )}
                    </div>
                    {errorMessage && (
                            <p className='text-sm text-red-600'>{errorMessage}</p>
                        )}
                    <div className="flex flex-row gap-2 justify-end">
                        <Button onClick={onCancel} className=' bg-zinc-700 hover:bg-zinc-500 cursor-pointer'>Anulează</Button>
                        <Button type='submit'
                            disabled={loading}
                            className='bg-teal-500 hover:bg-teal-600 cursor-pointer w-fit'>
                            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            {success ? < >Salvat  <Check /></> : 'Salvează'}</Button>
                    </div>

                </form>
            </DialogContent>
        </Dialog>
    )
}