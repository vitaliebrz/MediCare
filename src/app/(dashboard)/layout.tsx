import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { Bottombar } from '@/components/dashboard/bottombar';
import { getCurrentUser } from '@/lib/auth/current-user';
import type { User } from '@/lib/db/schema';

const roleLabels: Record<User['role'], string> = {
  admin: 'Administrator',
  medic: 'Medic',
  asistent: 'Asistent',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirecționează la /login dacă nu e nimeni logat
  const user = await getCurrentUser();

  return (
    <div className='flex h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950'>
      <Sidebar userEmail={user.email}
        userName={user.fullName}
        userRole={roleLabels[user.role]}
      />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Topbar userEmail={user.email} userName={user.fullName} />
        <main className='flex-1 overflow-y-auto pb-16 md:pb-0'>{children}</main>
        <Bottombar  />
      </div>

    </div>
  )
}
