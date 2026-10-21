import type { LucideIcon } from 'lucide-react';

// Mesajul pentru o listă goală, același pe toate paginile
export const EmptyState = ({ icon: Icon, title, description, action }: {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
}) => (
    <div className='flex flex-col items-center gap-3 rounded-lg border border-dashed bg-white px-4 py-16 text-center'>
        <Icon className='h-10 w-10 text-slate-300' aria-hidden />
        <p className='font-medium'>{title}</p>
        {description && <p className='text-sm text-slate-500'>{description}</p>}
        {action}
    </div>
);
