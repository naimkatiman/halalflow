'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartLineUp, MagnifyingGlass, BookmarkSimple, FileText, Kanban, TrendUp } from '@phosphor-icons/react';

const links = [
  { href: '/', label: 'Dashboard', icon: ChartLineUp },
  { href: '/screener', label: 'Screener', icon: MagnifyingGlass },
  { href: '/watchlist', label: 'Watchlist', icon: BookmarkSimple },
  { href: '/research', label: 'Research', icon: FileText },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200/50 bg-white/80 backdrop-blur-xl">
      <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center">
            <TrendUp className="w-4 h-4 text-emerald-600" weight="bold" />
          </div>
          <span className="font-bold text-base tracking-tight text-zinc-950">
            Halal<span className="text-emerald-600">Flow</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  active
                    ? 'bg-emerald-600/10 text-emerald-700'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" weight={active ? 'bold' : 'regular'} />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>
    </nav>
  );
}
