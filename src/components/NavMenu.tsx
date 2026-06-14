'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import clsx from 'clsx';
import { CaretDown } from '@phosphor-icons/react';

interface NavMenuProps {
  /** Accessible name for the trigger and its panel. */
  ariaLabel: string;
  /** Which edge the panel aligns to under the trigger. */
  align?: 'start' | 'end';
  /** Classes for the trigger <button>. */
  triggerClassName?: string;
  /** Inner content of the trigger button. Receives the open state. */
  renderTrigger: (open: boolean) => ReactNode;
  /** Panel content. Receives a `close` callback to call on item activation. */
  children: (close: () => void) => ReactNode;
}

/**
 * Accessible disclosure menu: a button that reveals a panel of links/actions.
 * Uses the disclosure pattern (aria-expanded + aria-controls) rather than
 * role="menu", which is the correct semantics for a panel of navigation links.
 * Closes on outside pointer, Escape (returns focus to the trigger), and item
 * activation. ArrowDown opens and focuses the first item.
 */
export function NavMenu({ ariaLabel, align = 'end', triggerClassName, renderTrigger, children }: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = () => setOpen(false);

  // Play a short scale+fade entrance via WAAPI when the panel mounts — no
  // setState, no global keyframe, and it no-ops under reduced-motion.
  const setPanelRef = (node: HTMLDivElement | null) => {
    panelRef.current = node;
    if (node && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.animate(
        [
          { opacity: 0, transform: 'scale(0.95)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        { duration: 140, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      );
    }
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => {
        panelRef.current?.querySelector<HTMLElement>('a,button')?.focus();
      });
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={triggerClassName}
      >
        {renderTrigger(open)}
      </button>
      {open && (
        <div
          ref={setPanelRef}
          id={panelId}
          aria-label={ariaLabel}
          style={{ transformOrigin: align === 'end' ? 'top right' : 'top left' }}
          className={clsx(
            'absolute z-50 mt-2 min-w-[15rem] rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg shadow-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/20',
            align === 'end' ? 'right-0' : 'left-0'
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

/** Down caret used inside menu triggers; rotates when the menu is open. */
export function MenuCaret({ open }: { open: boolean }) {
  return (
    <CaretDown
      className={clsx('w-3 h-3 shrink-0 transition-transform duration-150 ease-out', open && 'rotate-180')}
      aria-hidden="true"
    />
  );
}
