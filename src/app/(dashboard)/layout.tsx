import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { Bottombar } from '@/components/dashboard/bottombar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  const userName = user?.user_metadata.metadata?.full_name as string | undefined;

  return (
    <div className='flex h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950'>
      <Sidebar userEmail={user.email ?? ''}
        userName={userName}
        userRole='Stomatolog'
      />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Topbar userEmail={user.email ?? ''} userName={userName} />
        <main className='flex-1 overflow-y-auto pb-16 md:pb-0'>{children}</main>
        <Bottombar  />
      </div>

    </div>
  )
}