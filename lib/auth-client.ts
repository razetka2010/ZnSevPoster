import type { SessionUser } from '@/types';

export const AUTH_CHANGE_EVENT = 'znaniesevera-auth-change';

export function notifyAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

/** Надёжный редирект после входа — cookie подхватывается сразу */
export function redirectAfterAuth(url: string) {
  notifyAuthChange();
  window.location.href = url;
}

export async function fetchCurrentUser(): Promise<SessionUser | null> {
  const res = await fetch('/api/auth/me', {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user ?? null;
}

export function getPostAuthRedirect(user: SessionUser, next: string): string {
  if (user.role === 'admin' && next.startsWith('/admin')) return next;
  if (user.role === 'admin') return '/admin';
  if (next === '/admin') return '/';
  return next || '/';
}
