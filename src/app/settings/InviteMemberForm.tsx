'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from '@phosphor-icons/react';
import { fetchWithCsrf } from '@/lib/csrf-client';

export function InviteMemberForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetchWithCsrf(`/api/orgs/${orgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add member');
        return;
      }
      setEmail('');
      setRole('member');
      if (data.type === 'invitation') {
        setSuccess(`Invitation sent to ${data.invite.email}`);
      } else {
        setSuccess(`${data.member.user.name} added as ${data.member.role}`);
      }
      router.refresh();
    } catch (err) {
      console.error('InviteMemberForm submit error:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-zinc-100">
      <label htmlFor="invite-email" className="text-xs font-semibold text-zinc-700">Add member by email</label>
      <div className="flex gap-2">
        <input
          id="invite-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="colleague@org.com"
          className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
        />
        <select
          id="invite-role"
          aria-label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
          className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-white"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" weight="bold" aria-hidden="true" />
          Add
        </button>
      </div>
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      {success && <p className="text-xs text-emerald-600" role="status">{success}</p>}
    </form>
  );
}
