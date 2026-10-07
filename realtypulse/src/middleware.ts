import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];
const PUBLIC_ROUTES = [...AUTH_ROUTES, '/auth/callback'];

export async function middleware(request: NextRequest) {
  // Next.js fires off speculative prefetch requests for every visible
  // <Link> (e.g. every Sidebar item) alongside the real navigation.
  // If several of these hit middleware at once while the access token
  // is near expiry, each one tries to refresh the SAME refresh token
  // concurrently — Supabase's reuse-detection sees the losers as reuse
  // of an already-rotated token and revokes the whole session. Prefetch
  // requests don't need auth enforced on them, so skip refreshing/
  // redirecting for them entirely and let the real navigation (which
  // has no such header) do that work exactly once.
  if (request.headers.get('next-router-prefetch') === '1' || request.headers.get('purpose') === 'prefetch') {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (err) {
    // A transient Supabase/network failure here must never crash the
    // middleware for every request (that would take the whole site
    // down). Fail safe: treat as "not logged in" for this one request
    // and let the user retry rather than 500ing the entire app.
    console.error('middleware: supabase.auth.getUser() failed', err);
  }

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_ROUTES.some((route) => path.startsWith(route));

  if (!user && !isPublic) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('next', path);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  if (user && AUTH_ROUTES.some((route) => path.startsWith(route))) {
    const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)',
  ],
};
