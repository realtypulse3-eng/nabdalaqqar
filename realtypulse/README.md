# RealtyPulse AI

A real, functional multi-tenant real estate CRM/SaaS — Next.js 14 (App
Router) + TypeScript + Tailwind CSS on the frontend, Supabase (Postgres +
Auth + RLS) on the backend.

## Auth flow — exactly two screens

Sign up → Sign in → Dashboard. There is no third "create your workspace"
screen anywhere in this app. The organization is created as part of
signup itself (using the brokerage name entered on that form). The one
edge case — Supabase email confirmation turned on, so there's no session
yet at signup time to create the org with — is handled silently: the
first time that user is authenticated after confirming their email, the
protected layout provisions a sensibly-named default organization with
zero extra input and continues straight into the dashboard. The
organization can be renamed anytime in Settings.

**Recommended:** keep Supabase email confirmation turned off
(Authentication → Providers → Email → "Confirm email") unless you
specifically need it, so every signup gets a session immediately and the
organization is always created with the name the user actually typed.

## Getting started

1. Create a Supabase project.
2. In the SQL editor, run `supabase/schema.sql`.
   - If you already have a project from an earlier version of this app,
     also run `supabase/migration-org-select-fix.sql` — see the comment
     at the top of that file for why it's needed.
3. `cp .env.example .env.local` and fill in your Supabase URL/keys.
4. `npm install && npm run dev`.

## Architecture

```
User → Supabase Auth → profiles (trigger-created) → memberships → organizations
                                                            ↓
                                    leads / clients / properties / deals /
                                    tasks / appointments / campaigns /
                                    conversations+messages / ai_agents
```

### Session resolution (`src/lib/services/organizations.ts`)

`getSessionResult()` returns one of three **distinct** states —
`unauthenticated`, `needs_organization`, or `authenticated` — rather than
collapsing "not logged in" and "logged in but no org yet" into a single
null value. That collapse was the root cause of an earlier login ↔
onboarding redirect loop: any transient hiccup reading the session could
get treated the same as "needs an organization" and misroute an
already-authenticated user. The protected layout
(`src/app/(app)/layout.tsx`) switches on this explicitly.

### Multi-tenancy & roles

`organizations` ← `memberships` (role: `owner` / `admin` / `agent` /
`staff`) → `profiles`. Every teammate signs in with their own email and
password — nobody shares a login, even when the whole office works out
of one organization. Role permissions are enforced in the database via
RLS (`schema.sql`) — `staff` is read-only, `agent`/`admin`/`owner` can
create and edit, only `admin`/`owner` can delete or manage the
team/org — and mirrored in the UI (`src/lib/permissions.ts`) so the
interface never offers a button a role can't actually use.

### AI Agents

`src/lib/services/ai/agent-service.ts` — real DB-backed agent registry
and run history. The included `AnthropicProvider` calls the real
Anthropic API when `ANTHROPIC_API_KEY` is set, and returns an honest
"not configured" error when it isn't. No agent result is ever fabricated.

### i18n / RTL

Dictionaries in `src/lib/i18n/locales/{en,ar}.json`. The language
switcher is built into `AuthShell`, so it's available on every
pre-authentication screen (login, signup, forgot-password,
reset-password) — not just after signing in. `<html dir>` flips between
`ltr`/`rtl` in the root layout based on a cookie, and the choice also
persists to the user's `profiles.language` column once they're logged in.

### Auth flow redirects

Login, signup, and password reset submit through a small
React-18-compatible `useActionState` hook (`src/lib/hooks/use-action-state.ts`)
that calls the Server Action as a plain function via `onSubmit`, not a
native `<form action={...}>` (React 18/Next 14 don't support passing
arbitrary functions there). Two things this hook specifically guards
against, because both have caused real bugs in this project before:

1. **Silently swallowed errors.** If the underlying Server Action throws
   for any reason, that's caught and merged into the returned state as
   `error` — never an unhandled promise rejection that leaves the UI
   frozen with zero feedback (no spinner, no error, nothing).
2. **Unreliable server-side `redirect()`.** Next only guarantees a
   server-thrown redirect reaches the browser when the action was
   triggered via a real form submission. These actions return
   `{ redirectTo: '/dashboard' }` instead, and `useActionRedirect`
   (`src/lib/hooks/use-action-redirect.ts`) calls `router.push()`
   client-side once it sees that field. `logout` is the one exception —
   it's wired to a real native `<form action={logout}>` in the topbar,
   so a server-side `redirect()` there is fine as-is.

## Known limitations

- File/image upload for property photos, real WhatsApp/email dispatch
  (messages are stored, not actually sent), pagination on long lists,
  and a proper in-app "Load Demo Data" button (the SQL RPC in
  `supabase/seed-demo-data.sql` exists — wire a button to it if wanted)
  are not built yet.
- `src/lib/supabase/types.ts` is hand-written to match `schema.sql`.
  Regenerate it from your live database for full type-safety:
  `npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts`
- Typechecks, lints, and builds cleanly in the sandbox this was built in
  (no network access to supabase.co from that sandbox), but connect it
  to a real Supabase project and click through the full flow yourself
  before treating it as end-to-end verified.
