import type { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowUp, ArrowDown } from '@phosphor-icons/react/dist/ssr';
import { SessionData, sessionOptions } from '@/lib/session';
import { withOrg } from '@/lib/db';
import { requireActiveSubscription } from '@/lib/require-subscription';
import { FUNDS, FUND_LABELS, fundTotals } from '@/lib/ledger';
import { formatMYR } from '@/lib/money';
import { ManualEntryForm } from './ManualEntryForm';

export const metadata: Metadata = {
  title: 'Kewangan — MosRev',
  description: 'Pantau tabung dan urus catatan kewangan masjid.',
};

const PAGE_SIZE = 20;

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ fund?: string; page?: string }>;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect('/login');
  if (!session.orgId) redirect('/onboarding');
  await requireActiveSubscription(session.orgId);

  const { fund: rawFund, page: pageRaw } = await searchParams;
  const fund = (FUNDS as ReadonlyArray<string>).includes(rawFund ?? '') ? rawFund : null;
  const page = Math.max(1, Math.floor(Number(pageRaw) || 1));

  const { entries, total, allEntries } = await withOrg(session.orgId, async (tx) => {
    const where = { orgId: session.orgId, ...(fund ? { fund } : {}) };
    const allWhere = { orgId: session.orgId };
    // Sequential on purpose: concurrent queries on one interactive transaction
    // are unsupported by Prisma and stall over high-latency connections.
    const entries = await tx.ledgerEntry.findMany({
      where,
      orderBy: { entryDate: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
    const total = await tx.ledgerEntry.count({ where });
    const allEntries = await tx.ledgerEntry.findMany({
      where: allWhere,
      select: { fund: true, direction: true, amount: true, description: true, entryDate: true, refType: true, refId: true },
    });
    return { entries, total, allEntries };
  });

  const totals = fundTotals(allEntries);
  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">Kewangan</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Pantau semua tabung masjid</p>
        </div>
        <a
          href="/api/ledger/export"
          download
          className="flex items-center gap-1.5 border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Eksport CSV
        </a>
      </div>

      {/* Fund cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {FUNDS.map((f) => {
          const isSelected = fund === f;
          return (
            <Link
              key={f}
              href={isSelected ? '/finance' : `/finance?fund=${f}`}
              aria-current={isSelected ? 'true' : undefined}
              className={`rounded-xl border p-4 transition-colors hover:bg-zinc-50 ${
                isSelected
                  ? 'border-zinc-900 bg-zinc-50'
                  : f === 'sewaan'
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-zinc-200 bg-white'
              }`}
            >
              <p className="text-xs font-medium text-zinc-500">{FUND_LABELS[f] ?? f}</p>
              <p className={`text-lg font-bold mt-1 ${totals[f] >= 0 ? 'text-zinc-950' : 'text-red-600'}`}>
                {formatMYR(totals[f] ?? 0)}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/finance"
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            !fund ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Semua tabung
        </Link>
        {FUNDS.map((f) => (
          <Link
            key={f}
            href={`/finance?fund=${f}`}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              fund === f ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {FUND_LABELS[f] ?? f}
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-4 py-3">
          <p className="text-sm text-zinc-500">
            Halaman {page} daripada {pages} · {total} catatan
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={fund ? `?fund=${fund}&page=${page - 1}` : `?page=${page - 1}`}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-emerald-200 transition-colors"
              >
                Sebelum
              </Link>
            )}
            {page < pages && (
              <Link
                href={fund ? `?fund=${fund}&page=${page + 1}` : `?page=${page + 1}`}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-emerald-200 transition-colors"
              >
                Seterusnya
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Entries table */}
      {entries.length === 0 ? (
        <div className="bg-white border border-zinc-200/70 border-dashed rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-zinc-500">Tiada catatan kewangan</p>
          <p className="text-xs text-zinc-400 mt-1">Gunakan borang di bawah untuk menambah catatan pertama.</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/70 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Catatan kewangan">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Tarikh</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Tabung</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Keterangan</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3 text-xs text-zinc-500 whitespace-nowrap">
                      {new Date(e.entryDate).toLocaleDateString('ms-MY')}
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-600 whitespace-nowrap">
                      {FUND_LABELS[e.fund] ?? e.fund}
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-700">
                      <div className="flex items-start gap-1.5">
                        {e.direction === 'in' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                        )}
                        <span>{e.description}</span>
                      </div>
                      {e.refType === 'booking' && e.refId && (
                        <Link
                          href={`/bookings/${e.refId}`}
                          className="text-xs text-emerald-600 hover:text-emerald-700 ml-5"
                        >
                          Lihat tempahan
                        </Link>
                      )}
                    </td>
                    <td className={`px-5 py-3 text-sm font-semibold text-right whitespace-nowrap ${e.direction === 'in' ? 'text-emerald-700' : 'text-red-600'}`}>
                      {e.direction === 'out' ? '−' : '+'}{formatMYR(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual entry form */}
      <ManualEntryForm />
    </div>
  );
}
