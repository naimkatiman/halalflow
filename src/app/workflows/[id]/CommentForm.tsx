'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaperPlaneTilt } from '@phosphor-icons/react';
import { fetchWithCsrf } from '@/lib/csrf-client';

export function CommentForm({ workflowId }: { workflowId: string }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetchWithCsrf(`/api/workflows/${workflowId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to post comment');
        return;
      }
      setBody('');
      router.refresh();
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a comment…"
        className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
      />
      <button
        type="submit"
        disabled={loading || !body.trim()}
        className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white font-medium text-sm px-3 py-2 rounded-lg transition-colors"
      >
        <PaperPlaneTilt className="w-3.5 h-3.5" weight="bold" />
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </form>
  );
}
