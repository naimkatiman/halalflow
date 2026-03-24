'use client';

import { useState } from 'react';
import { Plus, Trash, CaretRight, Columns } from '@phosphor-icons/react';
import { useKanban } from '@/lib/kanban-store';
import type { KanbanTask } from '@/types';
import clsx from 'clsx';

const COLUMNS: { id: KanbanTask['status']; label: string; borderColor: string; dot: string }[] = [
  { id: 'todo', label: 'To Do', borderColor: 'border-zinc-200', dot: 'bg-zinc-400' },
  { id: 'in_progress', label: 'In Progress', borderColor: 'border-amber-200', dot: 'bg-amber-500' },
  { id: 'done', label: 'Done', borderColor: 'border-emerald-200', dot: 'bg-emerald-500' },
];

const PRIORITIES: Record<KanbanTask['priority'], string> = {
  high: 'text-red-600 bg-red-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-zinc-500 bg-zinc-100',
};

function TaskCard({ task, onMove, onDelete }: {
  task: KanbanTask;
  onMove: (id: string, status: KanbanTask['status']) => void;
  onDelete: (id: string) => void;
}) {
  const otherStatuses = COLUMNS.filter(c => c.id !== task.status);

  return (
    <div className="bg-white border border-zinc-200/50 rounded-lg p-3.5 group hover:border-emerald-200 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-zinc-950 leading-snug flex-1">{task.title}</p>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all flex-shrink-0 active:scale-[0.98]"
        >
          <Trash className="w-3.5 h-3.5" />
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-zinc-400 mb-2.5 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', PRIORITIES[task.priority])}>
          {task.priority}
        </span>
        {task.label && (
          <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">{task.label}</span>
        )}
        {task.dueDate && (
          <span className="text-xs text-zinc-400 ml-auto" style={{ fontVariantNumeric: 'tabular-nums' }}>{task.dueDate}</span>
        )}
      </div>

      {/* Move actions */}
      <div className="flex gap-1.5 mt-3 pt-3 border-t border-zinc-100 opacity-0 group-hover:opacity-100 transition-all">
        {otherStatuses.map(col => (
          <button
            key={col.id}
            onClick={() => onMove(task.id, col.id)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 px-2 py-1 rounded active:scale-[0.98] transition-all"
          >
            <CaretRight className="w-3 h-3" weight="bold" />
            {col.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AddTaskForm({ status, onAdd, onCancel }: {
  status: KanbanTask['status'];
  onAdd: (task: Omit<KanbanTask, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<KanbanTask['priority']>('medium');
  const [label, setLabel] = useState('');

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), status, priority, label: label || undefined });
    onCancel();
  };

  return (
    <div className="bg-white border border-emerald-200 rounded-lg p-3.5 space-y-2.5">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel(); }}
        placeholder="Task title..."
        className="w-full bg-zinc-50 border border-zinc-200/80 rounded px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/40"
      />
      <div className="flex gap-2">
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as KanbanTask['priority'])}
          className="flex-1 bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-700 rounded px-2 py-1.5 focus:outline-none"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Label..."
          className="flex-1 bg-zinc-50 border border-zinc-200/80 rounded px-2 py-1.5 text-xs text-zinc-700 placeholder:text-zinc-400 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={submit}
          className="flex-1 bg-emerald-600 text-white text-xs font-medium py-1.5 rounded-lg hover:bg-emerald-700 active:scale-[0.98] transition-all"
        >
          Add Task
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-zinc-100 border border-zinc-200/80 text-zinc-500 text-xs font-medium py-1.5 rounded-lg hover:bg-zinc-200 active:scale-[0.98] transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const { byStatus, moveTask, addTask, deleteTask } = useKanban();
  const [addingIn, setAddingIn] = useState<KanbanTask['status'] | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tighter text-zinc-950 flex items-center gap-2">
          <Columns className="w-6 h-6 text-emerald-600" weight="duotone" />
          HalalFlow Kanban
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Track platform development tasks in real-time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COLUMNS.map(col => {
          const tasks = byStatus(col.id);
          return (
            <div key={col.id} className={clsx('bg-zinc-50/80 border rounded-xl p-4', col.borderColor)}>
              {/* Column header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={clsx('w-2 h-2 rounded-full', col.dot)} />
                  <span className="font-semibold text-sm text-zinc-950">{col.label}</span>
                  <span className="text-xs text-zinc-400 bg-white px-1.5 py-0.5 rounded-full border border-zinc-200/50">{tasks.length}</span>
                </div>
                <button
                  onClick={() => setAddingIn(col.id)}
                  className="text-zinc-400 hover:text-emerald-600 active:scale-[0.98] transition-all"
                >
                  <Plus className="w-4 h-4" weight="bold" />
                </button>
              </div>

              {/* Add form */}
              {addingIn === col.id && (
                <div className="mb-3">
                  <AddTaskForm
                    status={col.id}
                    onAdd={addTask}
                    onCancel={() => setAddingIn(null)}
                  />
                </div>
              )}

              {/* Tasks */}
              <div className="space-y-2.5">
                {tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onMove={moveTask}
                    onDelete={deleteTask}
                  />
                ))}
                {tasks.length === 0 && !addingIn && (
                  <div className="text-center py-8 text-zinc-400 text-xs">
                    No tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
