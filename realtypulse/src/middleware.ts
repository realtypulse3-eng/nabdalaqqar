if (!user && !isPublic) {
  const redirectUrl = new URL('/login', request.url);
  redirectUrl.searchParams.set('next', path);
  return NextResponse.redirect(redirectUrl);   // ← brand new response
}

if (user && AUTH_ROUTES.some((route) => path.startsWith(route))) {
  return NextResponse.redirect(new URL('/dashboard', request.url));  // ← brand new response too
}
