'use client'
import React from 'react'
import { Sidebar } from '@/components/settings/sidebar';


export default function Seetingslayout({
    children,
}: { children: React.ReactNode },
) {
    return (
        <div className='lg:flex lg:h-full lg:overflow-hidden bg-slate-50 dark:bg-slate-950'>
            <Sidebar />
            <main className='flex-1 overflow-y-auto'>{children}</main>
        </div>
    )
}


