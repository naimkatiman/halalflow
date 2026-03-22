'use client';

import { useState, useEffect, useCallback } from 'react';
import type { KanbanTask } from '@/types';

const STORAGE_KEY = 'halalflow-kanban';

const DEFAULT_TASKS: KanbanTask[] = [
  { id: '1', title: 'Add real market data API integration', description: 'Connect to Alpha Vantage or Yahoo Finance for live prices', status: 'todo', priority: 'high', label: 'Backend', createdAt: '2026-03-22', dueDate: '2026-03-29' },
  { id: '2', title: 'Build alerts & notifications system', description: 'Price alerts via email/Telegram when watchlist stocks hit target', status: 'todo', priority: 'high', label: 'Feature', createdAt: '2026-03-22' },
  { id: '3', title: 'Add more GCC/MENA stocks to database', description: 'Tadawul, DFM, ADX listed halal-screened equities', status: 'todo', priority: 'medium', label: 'Data', createdAt: '2026-03-22' },
  { id: '4', title: 'Implement Shariah screening engine', description: 'Core AAOIFI-based debt/cash/revenue ratio checks', status: 'done', priority: 'high', label: 'Core', createdAt: '2026-03-22' },
  { id: '5', title: 'Build company profile pages', description: 'Full compliance breakdown with pass/fail criteria', status: 'done', priority: 'high', label: 'UI', createdAt: '2026-03-22' },
  { id: '6', title: 'Build watchlist feature', description: 'Persistent local watchlist with star/unstar', status: 'done', priority: 'medium', label: 'Feature', createdAt: '2026-03-22' },
  { id: '7', title: 'Integrate Purification calculator', description: 'Show exact dividend purification amounts per holding', status: 'in_progress', priority: 'medium', label: 'Feature', createdAt: '2026-03-22' },
  { id: '8', title: 'Add PDF report export', description: 'Generate Shariah compliance certificates for each company', status: 'in_progress', priority: 'low', label: 'Export', createdAt: '2026-03-22' },
];

function load(): KanbanTask[] {
  if (typeof window === 'undefined') return DEFAULT_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_TASKS;
  } catch {
    return DEFAULT_TASKS;
  }
}

function save(tasks: KanbanTask[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function useKanban() {
  const [tasks, setTasks] = useState<KanbanTask[]>(DEFAULT_TASKS);

  useEffect(() => {
    setTasks(load());
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<KanbanTask>) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      save(next);
      return next;
    });
  }, []);

  const moveTask = useCallback((id: string, status: KanbanTask['status']) => {
    updateTask(id, { status });
  }, [updateTask]);

  const addTask = useCallback((task: Omit<KanbanTask, 'id' | 'createdAt'>) => {
    const newTask: KanbanTask = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks(prev => {
      const next = [...prev, newTask];
      save(next);
      return next;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      save(next);
      return next;
    });
  }, []);

  const byStatus = (status: KanbanTask['status']) => tasks.filter(t => t.status === status);

  return { tasks, updateTask, moveTask, addTask, deleteTask, byStatus };
}
