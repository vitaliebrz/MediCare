'use server'
import { db } from "@/lib/db";
import { categories, doctors } from "@/lib/db/schema";
import { categorySchema, type CategoryFormData } from "@/lib/validations/categories";
import { revalidatePath } from "next/cache";
import { count, eq } from 'drizzle-orm';


export async function getCategories() {
    const result = await db.select().from(categories);
    return result
}

export async function createCategory(data: CategoryFormData) {
    const result = categorySchema.safeParse(data);
    if (!result.success) {
        return {
            success: false,
            error: 'Datele nu sunt completate corect'
        }
    }
    const validated = result.data;
    await db.insert(categories).values({
        ...validated,
    })
    revalidatePath('/setari/categorii')
    return { success: true }
}
async function getCategoryUsageError(id: string):Promise<string | null>{

const [{ total }] = await db
            .select({ total: count() })
            .from(doctors)
        .where(eq(doctors.categoryId, id))
    if (total > 0) {
            return `Categoria nu poate fi ștearsă, este folosită de ${total >1 ? `${total} medici`: 'un medic'}`
    }
    return null;
}
export async function checkCategoryUsage(id: string) {
    try {
        const usageError = await getCategoryUsageError(id);
        if (usageError) {
            return { success: false, error: usageError };
        }
        return { success: true };
    } catch {
        return{success: false, error: 'Ceva nu a mers bine'}
    }
}
export async function deleteCategory(id: string) {
    try {
        const usageError = await getCategoryUsageError(id);
        if (usageError) {
            return { success: false, error: usageError };
        }
        await db.delete(categories).where(eq(categories.id, id))
        revalidatePath('/setari/categorii')
        return {
            success: true

        }
    } catch {
        return {
            success: false,
            error: `Ceva nu a mers la ștergerea categoriei`
        }
    }
}
