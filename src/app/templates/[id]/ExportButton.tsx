'use client';

import { useState, useEffect, useRef } from 'react';
import { MorphIcon } from '@/components/morph/MorphIcon';

export function ExportButton({ templateId, templateName }: { templateId: string; templateName: string }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    },
    [],
  );

  const handleExport = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/templates/${templateId}/export`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.error === 'string' ? data.error : 'Export failed. Try again.');
        return;
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateName.replace(/\s+/g, '_').toLowerCase()}_template.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSucceeded(true);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSucceeded(false), 1600);
    } catch (err) {
      console.error('Template export failed:', err);
      setError('Export failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-1.5 border border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-800 disabled:opacity-50 font-medium text-sm px-3 py-2 rounded-lg transition-colors"
      >
        <MorphIcon name="downloadCheck" active={succeeded} size={14} className="shrink-0" />
        {loading ? 'Exporting…' : succeeded ? 'Exported' : 'Export'}
      </button>
      {error && (
        <p
          className="absolute right-0 top-full mt-2 w-72 z-10 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 shadow-sm"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
