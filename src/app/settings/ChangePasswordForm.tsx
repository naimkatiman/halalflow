'use client';

import { useState } from 'react';
import { Check } from '@phosphor-icons/react';
import { fetchWithCsrf } from '@/lib/csrf-client';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithCsrf('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to change password');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated. Use it the next time you sign in.');
    } catch (err) {
      console.error('ChangePasswordForm submit error:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="current-password" className="text-xs font-semibold text-zinc-700">
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className={inputCls}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="new-password" className="text-xs font-semibold text-zinc-700">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className={inputCls}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="confirm-password" className="text-xs font-semibold text-zinc-700">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className={inputCls}
          />
        </div>
      </div>
      <p className="text-xs text-zinc-500">At least 8 characters.</p>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      {success && (
        <p className="text-xs text-emerald-700 flex items-center gap-1.5" role="status">
          <Check className="w-3.5 h-3.5" weight="bold" aria-hidden="true" />
          {success}
        </p>
      )}
    </form>
  );
}
