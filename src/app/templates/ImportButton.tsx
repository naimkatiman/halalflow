'use client';

import { useRef, useState } from 'react';
import { UploadSimple } from '@phosphor-icons/react';
import { fetchWithCsrf } from '@/lib/csrf-client';

export function ImportButton() {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError('');
    try {
      const text = await file.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        setError('That file is not valid JSON. Export a template first and import that file.');
        setImporting(false);
        return;
      }
      const res = await fetchWithCsrf('/api/templates/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json().catch(() => null);
        setError(typeof data?.error === 'string' ? data.error : 'Import failed. Check the file and try again.');
        setImporting(false);
      }
    } catch (err) {
      console.error('Template import failed:', err);
      setError('Import failed. Check your connection and try again.');
      setImporting(false);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={importing}
        className="flex items-center gap-1.5 border border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-800 font-medium text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        <UploadSimple className="w-3.5 h-3.5" aria-hidden="true" />
        {importing ? 'Importing…' : 'Import'}
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
