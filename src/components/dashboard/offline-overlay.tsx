'use client'
import { useOnlineStatus } from "@/hooks/use-online-status"
export const OfflineOverlay = () => {
    const isOnline = useOnlineStatus();
    if (isOnline) {
        return null;
    }
    return (
        <div className="fixed inset-0 isolate z-60 bg-black/10 supports-backdrop-filter:backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 max-w-xs sm:max-w-sm text-center shadow-lg">
                <p className="text-lg font-medium">
                    Conexiunea la internet a dispărut
                </p>
                <p className="text-sm text-zinc-500 mt-2">
                    Mediul de lucru nu va fi disponibil până nu revine conexiunea
                </p>
            </div>
        </div>
    )
}