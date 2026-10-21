import { Sidebar } from '@/components/settings/sidebar';

// <div>, nu <main>: pagina e deja în <main>-ul din layout-ul principal
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className='lg:flex lg:h-full lg:overflow-hidden'>
            <Sidebar />
            <div className='flex-1 overflow-y-auto'>{children}</div>
        </div>
    );
}
