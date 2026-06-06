'use client';

import { useRef, useState } from 'react';
import { UploadSimple } from '@phosphor-icons/react';
import { fetchWithCsrf } from '@/lib/csrf-client';

export function ImportButton() {
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetchWithCsrf('/api/templates/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        setImporting(false);
      }
    } catch (err) {
      console.error('Template import failed:', err);
      setImporting(false);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
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
    </>
  );
}
