import { redirect } from 'next/navigation';
import { getSessionResult, ensureOrganizationSilently } from '@/lib/services/organizations';
import { listNotifications } from '@/lib/services/notifications';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const result = await getSessionResult();

  // Middleware is the SOLE authority for the /login <-> /dashboard
  // decision — it already guarantees a valid Supabase session exists for
  // every request that reaches this layout. Having a second, independent
  // place (here) also redirect to /login was the root cause of a real
  // infinite bounce loop: this layout could decide "unauthenticated"
  // (e.g. a missing profile row) on the same request middleware had just
  // decided was authenticated, sending the user back to /login, which
  // middleware would immediately bounce back to /dashboard, forever.
  // getSessionResult() now self-heals a missing profile row, so reaching
  // 'unauthenticated' here means something is genuinely broken (e.g. RLS
  // misconfigured) — surface that loudly via the error boundary instead
  // of silently redirecting into another loop.
  if (result.status === 'unauthenticated') {
    throw new Error(
      'Your account is signed in but no profile could be loaded or created. This usually means a database permission (RLS policy) issue — please contact support.'
    );
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
      <Sidebar organizationName={session.organizationName} organizationLogoUrl={session.organizationLogoUrl} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar userName={session.profile.full_name ?? session.profile.email} notifications={notifications} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
