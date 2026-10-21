import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { Bottombar } from '@/components/dashboard/bottombar';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getNotifications } from '@/lib/actions/notifications';
import { ROLE_LABELS } from '@/lib/constants/user-roles';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirecționează la /login dacă nu e nimeni logat
  const user = await getCurrentUser();
  // Fără await: pagina nu așteaptă alertele; clopoțelul le arată când sosesc (Suspense + use())
  // .catch: dacă alertele nu se pot calcula, clopoțelul rămâne gol, dar pagina merge mai departe
  const notifications = getNotifications().catch((error) => {
    console.error('Notifications error: ', error);
    return [];
  });

  return (
    <div className='flex h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950'>
      <Sidebar userEmail={user.email}
        userName={user.fullName}
        userRole={ROLE_LABELS[user.role]}
      />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Topbar userEmail={user.email} userName={user.fullName} notifications={notifications} />
        <main className='flex-1 overflow-y-auto pb-16 md:pb-0'>{children}</main>
        <Bottombar  />
      </div>

    </div>
  )
}
