'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Calendar, Heart, Home, LogIn, LogOut, MapPin, Settings, Ticket, User } from 'lucide-react';
import type { SessionUser } from '@/types';
import { AUTH_CHANGE_EVENT, fetchCurrentUser, redirectAfterAuth } from '@/lib/auth-client';

function navLinkClass(active: boolean) {
  return active
    ? 'font-medium text-blue-600'
    : 'text-gray-700 transition hover:text-blue-600';
}

function NavbarLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMapView = searchParams.get('view') === 'map';

  return (
    <div className="hidden items-center space-x-6 md:flex">
      <Link href="/" className={navLinkClass(pathname === '/' && !isMapView)}>
        Лента
      </Link>
      <Link href="/?view=map" className={navLinkClass(pathname === '/' && isMapView)}>
        Карта
      </Link>
      <Link href="/favorites" className={navLinkClass(pathname === '/favorites')}>
        Избранное
      </Link>
      <Link href="/tickets" className={navLinkClass(pathname === '/tickets')}>
        Мои билеты
      </Link>
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMapView = searchParams.get('view') === 'map';

  const tabClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 rounded-3xl px-3 py-2 text-[11px] transition ${
      active ? 'bg-slate-100 text-blue-600' : 'text-slate-500 hover:bg-slate-50'
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white px-4 py-2 shadow-[0_-1px_10px_rgba(15,23,42,0.04)] md:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
        <Link href="/" className={tabClass(pathname === '/' && !isMapView)}>
          <Home className="h-5 w-5" />
          Лента
        </Link>
        <Link href="/?view=map" className={tabClass(pathname === '/' && isMapView)}>
          <MapPin className="h-5 w-5" />
          Карта
        </Link>
        <Link href="/favorites" className={tabClass(pathname === '/favorites')}>
          <Heart className="h-5 w-5" />
          Избранное
        </Link>
        <Link href="/tickets" className={tabClass(pathname === '/tickets')}>
          <Ticket className="h-5 w-5" />
          Билеты
        </Link>
      </div>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  const loadUser = useCallback(async () => {
    const sessionUser = await fetchCurrentUser();
    setUser(sessionUser);
  }, []);

  useEffect(() => {
    loadUser();
    window.addEventListener(AUTH_CHANGE_EVENT, loadUser);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, loadUser);
  }, [loadUser, pathname]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    redirectAfterAuth('/');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex shrink-0 items-center gap-3" title="Знание Севера Афиша">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand)] text-white shadow-lg shadow-[rgba(11,78,131,0.18)]">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[var(--brand-dark)]">ЗС Афиша</span>
                <span className="text-xs text-slate-500">znaniesevera.vercel.app</span>
              </div>
            </Link>

            <Suspense fallback={null}>
              <NavbarLinks />
            </Suspense>

            <div className="flex items-center gap-2">
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="hidden items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 sm:flex"
                >
                  <Settings className="h-4 w-4" />
                  Админ
                </Link>
              )}
              {user && (
                <Link
                  href="/tickets"
                  className="hidden rounded-lg border border-[var(--brand)] px-3 py-2 text-sm font-medium text-[var(--brand)] hover:bg-[var(--brand-soft)] sm:flex"
                >
                  Мои билеты
                </Link>
              )}

              <Link
                href="/favorites"
                className={`rounded-full p-2 md:hidden ${
                  pathname === '/favorites' ? 'text-red-500' : 'text-gray-600'
                }`}
              >
                <Heart className="h-5 w-5" />
              </Link>

              {user ? (
                <div className="flex items-center gap-2">
                  <span className="hidden max-w-[120px] truncate text-sm text-gray-700 sm:block">
                    {user.name}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Выйти</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Link
                    href="/login"
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogIn className="h-4 w-4" />
                    Вход
                  </Link>
                  <Link
                    href="/register"
                    className="hidden rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 sm:block"
                  >
                    <User className="mr-1 inline h-4 w-4" />
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <BottomNav />
    </>
  );
}
