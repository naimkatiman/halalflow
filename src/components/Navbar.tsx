'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { GitBranch, SquaresFour, CheckSquare, Clipboard, GearSix, SignOut, List, X, Buildings, CreditCard, Clock, Tray, CalendarCheck, Coins, UsersThree } from '@phosphor-icons/react';
import clsx from 'clsx';
import { fetchWithCsrf } from '@/lib/csrf-client';

interface NavUser {
  id: string;
  name: string;
  email: string;
  orgId: string;
  orgName?: string | null;
  trial?: { daysLeft: number } | null;
  demo?: boolean;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPublicPage =
    pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/onboarding' || pathname.startsWith('/masjid') || pathname.startsWith('/ramadan');

  useEffect(() => {
    // Public pages render without a session — probing /api/auth/me there just
    // logs a 401 in every visitor's console.
    if (isPublicPage) return;
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.user) setUser(data.user); })
      .catch((err) => { console.error('Navbar auth check failed:', err); });
  }, [isPublicPage]);

  const handleLogout = async () => {
    await fetchWithCsrf('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const isAuth = pathname === '/login' || pathname === '/register' || pathname === '/onboarding';
  if (isAuth) {
    return (
      <header className="border-b border-zinc-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-zinc-950 text-sm">
            <GitBranch className="w-4 h-4 text-emerald-600" weight="bold" aria-hidden="true" />
            MosRev
          </Link>
        </div>
      </header>
    );
  }

  if (pathname === '/') {
    return (
      <header className="border-b border-zinc-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-zinc-950 text-sm shrink-0">
            <GitBranch className="w-4 h-4 text-emerald-600" weight="bold" aria-hidden="true" />
            MosRev
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-zinc-500">
            <a href="#use-cases" className="hover:text-zinc-900 transition-colors">Use cases</a>
            <a href="#how-it-works" className="hover:text-zinc-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-zinc-900 transition-colors">Pricing</a>
            <Link href="/masjid" className="hover:text-zinc-900 transition-colors">Direktori Masjid</Link>
            <Link href="/ramadan" className="hover:text-zinc-900 transition-colors">Ramadan</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="hidden sm:block bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors active:translate-y-px"
            >
              Get started
            </Link>
            <button
              type="button"
              className="sm:hidden p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-menu"
            >
              {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <List className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div id="mobile-nav-menu" className="sm:hidden border-t border-zinc-200/50 bg-white px-6 py-3 space-y-2">
            <a
              href="#use-cases"
              className="block text-sm text-zinc-500 hover:text-zinc-900 py-2"
              onClick={() => setMobileOpen(false)}
            >
              Use cases
            </a>
            <a
              href="#how-it-works"
              className="block text-sm text-zinc-500 hover:text-zinc-900 py-2"
              onClick={() => setMobileOpen(false)}
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="block text-sm text-zinc-500 hover:text-zinc-900 py-2"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </a>
            <Link
              href="/masjid"
              className="block text-sm text-zinc-500 hover:text-zinc-900 py-2"
              onClick={() => setMobileOpen(false)}
            >
              Direktori Masjid
            </Link>
            <Link
              href="/ramadan"
              className="block text-sm text-zinc-500 hover:text-zinc-900 py-2"
              onClick={() => setMobileOpen(false)}
            >
              Ramadan
            </Link>
            <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 py-2"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg text-center"
                onClick={() => setMobileOpen(false)}
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>
    );
  }

  const nav = [
    { href: '/dashboard', label: 'Dashboard', icon: SquaresFour },
    { href: '/workflows', label: 'Workflows', icon: CheckSquare },
    { href: '/templates', label: 'Templates', icon: Clipboard },
    { href: '/bookings', label: 'Tempahan', icon: CalendarCheck },
    { href: '/facilities', label: 'Kemudahan', icon: Buildings },
    { href: '/finance', label: 'Kewangan', icon: Coins },
    { href: '/community', label: 'Komuniti', icon: UsersThree },
    { href: '/billing', label: 'Billing', icon: CreditCard },
    { href: '/settings', label: 'Settings', icon: GearSix },
    ...(user?.demo ? [{ href: '/demo/outbox', label: 'Outbox', icon: Tray }] : []),
  ];

  return (
    <header className="border-b border-zinc-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-zinc-950 text-sm">
              <GitBranch className="w-4 h-4 text-emerald-600" weight="bold" aria-hidden="true" />
              MosRev
            </Link>
            {user?.demo && (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                Demo
              </span>
            )}
          </div>
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname.startsWith(href) ? 'page' : undefined}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                )}
              >
                <Icon className="w-3.5 h-3.5" weight={pathname.startsWith(href) ? 'fill' : 'regular'} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user?.trial && (
            <Link
              href="/billing"
              title={
                user.trial.daysLeft > 0
                  ? `Free trial: ${user.trial.daysLeft} ${user.trial.daysLeft === 1 ? 'day' : 'days'} left`
                  : 'Your free trial has ended'
              }
              className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 hover:border-amber-300 hover:text-amber-900 transition-colors"
            >
              <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span>{user.trial.daysLeft > 0 ? `Trial · ${user.trial.daysLeft}d left` : 'Trial ended'}</span>
            </Link>
          )}
          {user?.orgName && (
            <Link
              href="/settings"
              title={`Workspace: ${user.orgName}`}
              className="hidden xl:flex items-center gap-1.5 text-xs font-medium text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-full px-2.5 py-1 hover:border-zinc-300 hover:text-zinc-900 transition-colors max-w-[200px]"
            >
              <Buildings className="w-3 h-3 text-emerald-600 shrink-0" aria-hidden="true" />
              <span className="truncate">{user.orgName}</span>
            </Link>
          )}
          {user && (
            <>
              <span className="text-xs text-zinc-500 hidden lg:block truncate max-w-[160px]">{user.name}</span>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-50"
              >
                <SignOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </>
          )}
          <button
            type="button"
            className="lg:hidden p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu-auth"
          >
            {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <List className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div id="mobile-nav-menu-auth" className="lg:hidden border-t border-zinc-200/50 bg-white px-6 py-3 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              )}
            >
              <Icon className="w-4 h-4" weight={pathname.startsWith(href) ? 'fill' : 'regular'} aria-hidden="true" />
              {label}
            </Link>
          ))}
          {user && (
            <button
              type="button"
              onClick={() => { setMobileOpen(false); handleLogout(); }}
              className="flex lg:hidden items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
            >
              <SignOut className="w-4 h-4" aria-hidden="true" />
              Sign out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
