'use client';

import { useState } from 'react';
import { Check, LinkSimple } from '@phosphor-icons/react';

export function CopyInviteLink({ url, label = 'Copy link' }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (http / old browser) — select-able fallback.
      window.prompt('Copy this invite link:', url);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <LinkSimple className="w-3 h-3" aria-hidden="true" />
          {label}
        </>
      )}
    </button>
  );
}
