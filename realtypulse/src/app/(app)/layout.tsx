import { redirect } from 'next/navigation';
import { getSessionResult, ensureOrganizationSilently } from '@/lib/services/organizations';
import { listNotifications } from '@/lib/services/notifications';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const result = await getSessionResult();

  // Not logged in at all → the only place that goes is /login. This is
  // also enforced by middleware, but checking it explicitly here too
  // means a transient session-read hiccup can never be confused with
  // "needs an organization" and misrouted into a setup screen.
  if (result.status === 'unauthenticated') {
    redirect('/login');
  }

  // Logged in but no workspace yet (can only happen if Supabase email
  // confirmation is on, so signup couldn't create the org immediately).
  // There is intentionally no visible "create your workspace" screen —
  // provision a sensible default silently and continue straight into
  // the dashboard, exactly like a normal load.
  if (result.status === 'needs_organization') {
    await ensureOrganizationSilently(result.userId, result.profile);
    redirect('/dashboard');
  }

  const { session } = result;
  const notifications = await listNotifications(session.userId);

  return (
    <div className="flex min-h-screen">
      <Sidebar organizationName={session.organizationName} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar userName={session.profile.full_name ?? session.profile.email} notifications={notifications} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
