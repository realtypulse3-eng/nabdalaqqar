'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ensureOrganization } from '@/lib/services/organizations';

export interface ActionState {
  error?: string;
  success?: string;
  // Set when the action succeeded and the client should navigate.
  // Deliberately NOT using next/navigation's redirect() here: these
  // actions are invoked as plain function calls (via a custom
  // React-18-compatible useActionState hook), not through a native
  // <form action={...}> submission — and Next only guarantees a
  // server-thrown redirect() reaches the browser reliably for the
  // latter. Returning a target and letting the client call
  // router.push() works regardless of how the action was invoked.
  redirectTo?: string;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Please enter a valid email and password.' };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { error: error.message };

  return { redirectTo: '/dashboard' };
}

const signupSchema = z
  .object({
    fullName: z.string().min(1),
    organizationName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid signup details.' };

  const { fullName, organizationName, email, password } = parsed.data;
  const supabase = createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (signUpError) return { error: signUpError.message };
  if (!signUpData.user) {
    return { success: 'Check your email to confirm your account before signing in.' };
  }

  // No session yet means Supabase email confirmation is turned on — org
  // creation needs an authenticated session (for RLS), so it can't
  // happen here. The very first time this user is authenticated after
  // confirming, the protected layout auto-provisions a default-named
  // organization with zero extra input — there is intentionally no
  // separate "create your workspace" screen anywhere in this app.
  if (!signUpData.session) {
    return { success: 'Check your email to confirm your account before signing in.' };
  }

  try {
    await ensureOrganization(signUpData.user.id, organizationName);
  } catch (err) {
    console.error('ensureOrganization failed during signup:', err);
    return { error: err instanceof Error ? err.message : 'Could not set up your workspace. Please try again.' };
  }

  return { redirectTo: '/dashboard' };
}

// Logout is wired to a real native <form action={logout}> (see
// components/layout/topbar.tsx), not the custom-hook path, so a
// server-thrown redirect() is reliable here.
export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

const emailSchema = z.object({ email: z.string().email() });

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Please enter a valid email.' };

  const supabase = createClient();
  const redirectTarget = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`;
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: redirectTarget });

  return { success: "If an account exists for that email, a reset link is on its way." };
}

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid password.' };

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  return { redirectTo: '/login' };
}
