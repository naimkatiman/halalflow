'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SquaresFour, CheckSquare, Clipboard, GearSix, SignOut, List, X, Buildings, CreditCard, Clock, Tray, CalendarCheck, Coins, UsersThree } from '@phosphor-icons/react';
import clsx from 'clsx';
import { fetchWithCsrf } from '@/lib/csrf-client';
import { Logo } from '@/components/Logo';
import { NavMenu, MenuCaret } from '@/components/NavMenu';

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
            <Logo className="h-5 w-5 text-emerald-600" />
            MosRev
          </Link>
        </div>
      </header>
    );
  }

  // Community directory pages are public surfaces — anonymous visitors get the
  // landing chrome (Sign in / Get started), not the app chrome.
  if (pathname === '/' || pathname.startsWith('/masjid') || pathname.startsWith('/ramadan')) {
    return (
      <header className="border-b border-zinc-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-zinc-950 text-sm shrink-0">
            <Logo className="h-5 w-5 text-emerald-600" />
            MosRev
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/#use-cases" className="hover:text-zinc-900 transition-colors">Use cases</Link>
            <Link href="/#how-it-works" className="hover:text-zinc-900 transition-colors">How it works</Link>
            <Link href="/#pricing" className="hover:text-zinc-900 transition-colors">Pricing</Link>
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
            <Link
              href="/#use-cases"
              className="block text-sm text-zinc-500 hover:text-zinc-900 py-2"
              onClick={() => setMobileOpen(false)}
            >
              Use cases
            </Link>
            <Link
              href="/#how-it-works"
              className="block text-sm text-zinc-500 hover:text-zinc-900 py-2"
              onClick={() => setMobileOpen(false)}
            >
              How it works
            </Link>
            <Link
              href="/#pricing"
              className="block text-sm text-zinc-500 hover:text-zinc-900 py-2"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
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

  // Primary destinations stay inline; the four Masjid-ops modules collapse into
  // one dropdown and account/billing/settings/outbox fold into the account menu.
  const primaryNav = [
    { href: '/dashboard', label: 'Dashboard', icon: SquaresFour },
    { href: '/workflows', label: 'Workflows', icon: CheckSquare },
    { href: '/templates', label: 'Templates', icon: Clipboard },
  ];
  const masjidOps = [
    { href: '/bookings', label: 'Tempahan', icon: CalendarCheck, gloss: 'Bookings' },
    { href: '/facilities', label: 'Kemudahan', icon: Buildings, gloss: 'Facilities' },
    { href: '/finance', label: 'Kewangan', icon: Coins, gloss: 'Finance' },
    { href: '/community', label: 'Komuniti', icon: UsersThree, gloss: 'Community' },
  ];
  const accountNav = [
    { href: '/billing', label: 'Billing', icon: CreditCard },
    { href: '/settings', label: 'Settings', icon: GearSix },
    ...(user?.demo ? [{ href: '/demo/outbox', label: 'Outbox', icon: Tray }] : []),
  ];

  const isActive = (href: string) => pathname.startsWith(href);
  const masjidActive = masjidOps.some((i) => isActive(i.href));
  const accountActive = accountNav.some((i) => isActive(i.href));
  const initials = user?.name
    ? user.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '·';

  const primaryLinkClass = (href: string) =>
    clsx(
      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
      'tap',
      isActive(href) ? 'bg-emerald-50 text-emerald-700' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
    );
  const menuItemClass = (active: boolean) =>
    clsx(
      'flex items-center gap-2.5 w-full text-left rounded-lg px-2.5 py-2 text-sm font-medium',
      'tap',
      active ? 'bg-emerald-50 text-emerald-700' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
    );

  return (
    <header className="border-b border-zinc-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-zinc-950 text-sm">
              <Logo className="h-5 w-5 text-emerald-600" />
              MosRev
            </Link>
            {user?.demo && (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                Demo
              </span>
            )}
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {primaryNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={primaryLinkClass(href)}
              >
                <Icon className="w-3.5 h-3.5" weight={isActive(href) ? 'fill' : 'regular'} aria-hidden="true" />
                {label}
              </Link>
            ))}
            <NavMenu
              ariaLabel="Masjid operations"
              align="start"
              triggerClassName={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                'tap',
                masjidActive ? 'bg-emerald-50 text-emerald-700' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              )}
              renderTrigger={(open) => (
                <>
                  <Buildings className="w-3.5 h-3.5" weight={masjidActive ? 'fill' : 'regular'} aria-hidden="true" />
                  <span>Masjid Ops</span>
                  <MenuCaret open={open} />
                </>
              )}
            >
              {(close) => (
                <>
                  <p className="px-2.5 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Masjid Ops
                  </p>
                  {masjidOps.map(({ href, label, icon: Icon, gloss }) => (
                    <Link
                      key={href}
                      href={href}
                      aria-current={isActive(href) ? 'page' : undefined}
                      onClick={close}
                      className={menuItemClass(isActive(href))}
                    >
                      <Icon className="w-4 h-4 shrink-0" weight={isActive(href) ? 'fill' : 'regular'} aria-hidden="true" />
                      <span className="flex flex-col leading-tight">
                        <span>{label}</span>
                        <span className="text-[11px] font-normal text-zinc-500">{gloss}</span>
                      </span>
                    </Link>
                  ))}
                </>
              )}
            </NavMenu>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user?.trial && (
            <Link
              href="/billing"
              title={
                user.trial.daysLeft > 0
                  ? `Free trial: ${user.trial.daysLeft} ${user.trial.daysLeft === 1 ? 'day' : 'days'} left`
                  : 'Your free trial has ended'
              }
              className={clsx(
                'hidden lg:flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 hover:border-amber-300 hover:text-amber-900',
                'tap'
              )}
            >
              <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span>{user.trial.daysLeft > 0 ? `Trial · ${user.trial.daysLeft}d left` : 'Trial ended'}</span>
            </Link>
          )}
          {user && (
            <div className="hidden md:block">
              <NavMenu
                ariaLabel="Account and settings"
                align="end"
                triggerClassName={clsx(
                  'flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border',
                  'tap',
                  accountActive
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-transparent hover:border-zinc-200 hover:bg-zinc-50'
                )}
                renderTrigger={(open) => (
                  <>
                    <span
                      className="grid place-items-center w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-semibold"
                      aria-hidden="true"
                    >
                      {initials}
                    </span>
                    <span className="hidden lg:block text-xs font-medium text-zinc-700 max-w-[110px] truncate">
                      {user.name}
                    </span>
                    <MenuCaret open={open} />
                  </>
                )}
              >
                {(close) => (
                  <>
                    <div className="px-2.5 py-2">
                      {user.orgName && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                          <Buildings className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                          <span className="truncate">{user.orgName}</span>
                        </div>
                      )}
                      <p className="mt-0.5 text-xs text-zinc-500 truncate">{user.email}</p>
                    </div>
                    <div className="my-1 h-px bg-zinc-100" />
                    {accountNav.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        aria-current={isActive(href) ? 'page' : undefined}
                        onClick={close}
                        className={menuItemClass(isActive(href))}
                      >
                        <Icon className="w-4 h-4 shrink-0" weight={isActive(href) ? 'fill' : 'regular'} aria-hidden="true" />
                        {label}
                      </Link>
                    ))}
                    <div className="my-1 h-px bg-zinc-100" />
                    <button
                      type="button"
                      onClick={() => { close(); handleLogout(); }}
                      className={menuItemClass(false)}
                    >
                      <SignOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                      Sign out
                    </button>
                  </>
                )}
              </NavMenu>
            </div>
          )}
          <button
            type="button"
            className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors"
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
        <div id="mobile-nav-menu-auth" className="md:hidden border-t border-zinc-200/50 bg-white px-4 py-3 space-y-1">
          {user && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
              <span
                className="grid place-items-center w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-semibold shrink-0"
                aria-hidden="true"
              >
                {initials}
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-zinc-900 truncate">{user.orgName ?? user.name}</span>
                <span className="text-xs text-zinc-500 truncate">{user.email}</span>
              </span>
            </div>
          )}
          {primaryNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className={menuItemClass(isActive(href))}
            >
              <Icon className="w-4 h-4 shrink-0" weight={isActive(href) ? 'fill' : 'regular'} aria-hidden="true" />
              {label}
            </Link>
          ))}
          <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Masjid Ops</p>
          {masjidOps.map(({ href, label, icon: Icon, gloss }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className={menuItemClass(isActive(href))}
            >
              <Icon className="w-4 h-4 shrink-0" weight={isActive(href) ? 'fill' : 'regular'} aria-hidden="true" />
              <span>
                {label} <span className="text-zinc-500 font-normal">· {gloss}</span>
              </span>
            </Link>
          ))}
          <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Account</p>
          {accountNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className={menuItemClass(isActive(href))}
            >
              <Icon className="w-4 h-4 shrink-0" weight={isActive(href) ? 'fill' : 'regular'} aria-hidden="true" />
              {label}
            </Link>
          ))}
          {user && (
            <button
              type="button"
              onClick={() => { setMobileOpen(false); handleLogout(); }}
              className={clsx(menuItemClass(false), 'mt-1')}
            >
              <SignOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              Sign out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
