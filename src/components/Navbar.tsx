'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { GitBranch, SquaresFour, CheckSquare, Clipboard, GearSix, SignOut } from '@phosphor-icons/react';
import clsx from 'clsx';

interface NavUser {
  id: string;
  name: string;
  email: string;
  orgId: string;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.user) setUser(data.user); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
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
            <GitBranch className="w-4 h-4 text-emerald-600" weight="bold" />
            HalalFlow
          </Link>
        </div>
      </header>
    );
  }

  const nav = [
    { href: '/dashboard', label: 'Dashboard', icon: SquaresFour },
    { href: '/workflows', label: 'Workflows', icon: CheckSquare },
    { href: '/templates', label: 'Templates', icon: Clipboard },
    { href: '/settings', label: 'Settings', icon: GearSix },
  ];

  return (
    <header className="border-b border-zinc-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-zinc-950 text-sm shrink-0">
            <GitBranch className="w-4 h-4 text-emerald-600" weight="bold" />
            HalalFlow
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                )}
              >
                <Icon className="w-3.5 h-3.5" weight={pathname.startsWith(href) ? 'fill' : 'regular'} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 hidden sm:block truncate max-w-[160px]">{user.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-50"
            >
              <SignOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
