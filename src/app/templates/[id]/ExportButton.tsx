'use client';

import { DownloadSimple } from '@phosphor-icons/react';

export function ExportButton({ templateId, templateName }: { templateId: string; templateName: string }) {
  const handleExport = async () => {
    try {
      const res = await fetch(`/api/templates/${templateId}/export`);
      if (!res.ok) return;
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateName.replace(/\s+/g, '_').toLowerCase()}_template.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="flex items-center gap-1.5 border border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-800 font-medium text-sm px-3 py-2 rounded-lg transition-colors"
    >
      <DownloadSimple className="w-3.5 h-3.5" aria-hidden="true" />
      Export
    </button>
  );
}
