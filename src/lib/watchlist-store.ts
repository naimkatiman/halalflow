'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'halalflow-watchlist';

function loadWatchlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

// Simple hook — shared state via localStorage events for multi-tab sync
export function useWatchlist() {
  const [watchedIds, setWatchedIds] = useState<string[]>([]);

  useEffect(() => {
    setWatchedIds(loadWatchlist());
    const handler = () => setWatchedIds(loadWatchlist());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const toggle = useCallback((id: string) => {
    setWatchedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      saveWatchlist(next);
      return next;
    });
  }, []);

  const add = useCallback((id: string) => {
    setWatchedIds(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveWatchlist(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setWatchedIds(prev => {
      const next = prev.filter(x => x !== id);
      saveWatchlist(next);
      return next;
    });
  }, []);

  const isWatched = useCallback((id: string) => watchedIds.includes(id), [watchedIds]);

  return { watchedIds, toggle, add, remove, isWatched };
}
