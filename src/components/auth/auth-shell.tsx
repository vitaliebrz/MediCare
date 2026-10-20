import DentalToothIcon from '@iconify-react/hugeicons/dental-tooth';

// Cadrul comun pentru paginile de autentificare: logo + formular în stânga, prezentare în dreapta
export const AuthShell = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className=' flex flex-col-reverse md:flex-row bg-linear-to-r from-white from-50% black to-50% w-full h-screen'>
            <div className='h-dvh md:w-1/2 flex justify-center items-center'>
                <div className='w-lg lg:max-w-md lg:w-1/2 px-5'>
                    <div className="mb-8">
                        <div className="flex items-center gap-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                            <div className="bg-teal-500 text-white text-lg p-2 rounded-lg">
                                <DentalToothIcon className='w-7 h-7' />
                            </div>
                            MediCare
                        </div>
                    </div>
                    {children}
                </div>
            </div>

            <div className='hidden md:flex flex-col items-center justify-center bg-zinc-900 h-dvh md:w-1/2 p-12'>
                <div className="w-max bg-teal-500/10 border border-teal-500/20 text-teal-500 text-lg p-2 rounded-2xl">
                    <DentalToothIcon className='h-14 w-14' />
                </div>
                <h1 className='font-semibold text-2xl mt-8 text-white'>MediCare</h1>
                <p className='text-center mt-3 text-zinc-500'>Sistem de management al clinicii dentare. <br className='hidden lg:block' /> Gestionează pacienți, programări și fișe <br className='hidden lg:block' /> medicale într-un singur loc.</p>
            </div>
        </div>
    );
};
