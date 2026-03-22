'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronRight, Columns3 } from 'lucide-react';
import { useKanban } from '@/lib/kanban-store';
import type { KanbanTask } from '@/types';
import clsx from 'clsx';

const COLUMNS: { id: KanbanTask['status']; label: string; color: string; dot: string }[] = [
  { id: 'todo', label: 'To Do', color: 'border-slate-500/30', dot: 'bg-slate-400' },
  { id: 'in_progress', label: 'In Progress', color: 'border-amber-500/30', dot: 'bg-amber-400' },
  { id: 'done', label: 'Done', color: 'border-emerald-500/30', dot: 'bg-emerald-400' },
];

const PRIORITIES: Record<KanbanTask['priority'], string> = {
  high: 'text-red-400 bg-red-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  low: 'text-slate-400 bg-slate-500/10',
};

function TaskCard({ task, onMove, onDelete }: {
  task: KanbanTask;
  onMove: (id: string, status: KanbanTask['status']) => void;
  onDelete: (id: string) => void;
}) {
  const otherStatuses = COLUMNS.filter(c => c.id !== task.status);

  return (
    <div className="bg-[#0f172a] border border-white/8 rounded-lg p-3.5 group hover:border-white/15 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium leading-snug flex-1">{task.title}</p>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 mb-2.5 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', PRIORITIES[task.priority])}>
          {task.priority}
        </span>
        {task.label && (
          <span className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full">{task.label}</span>
        )}
        {task.dueDate && (
          <span className="text-xs text-slate-600 ml-auto">{task.dueDate}</span>
        )}
      </div>

      {/* Move actions */}
      <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-all">
        {otherStatuses.map(col => (
          <button
            key={col.id}
            onClick={() => onMove(task.id, col.id)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
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
    <div className="bg-[#0f172a] border border-emerald-500/30 rounded-lg p-3.5 space-y-2.5">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel(); }}
        placeholder="Task title..."
        className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40"
      />
      <div className="flex gap-2">
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as KanbanTask['priority'])}
          className="flex-1 bg-white/5 border border-white/10 text-xs text-slate-300 rounded px-2 py-1.5 focus:outline-none"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Label..."
          className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={submit}
          className="flex-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium py-1.5 rounded hover:bg-emerald-500/30 transition-colors"
        >
          Add Task
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-white/5 border border-white/10 text-slate-400 text-xs font-medium py-1.5 rounded hover:bg-white/10 transition-colors"
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Columns3 className="w-6 h-6 text-emerald-400" />
          HalalFlow Kanban
        </h1>
        <p className="text-slate-400 text-sm mt-1">Track platform development tasks in real-time</p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {COLUMNS.map(col => {
          const tasks = byStatus(col.id);
          return (
            <div key={col.id} className={clsx('bg-[#111827] border rounded-xl p-4', col.color)}>
              {/* Column header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={clsx('w-2 h-2 rounded-full', col.dot)} />
                  <span className="font-semibold text-sm">{col.label}</span>
                  <span className="text-xs text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
                </div>
                <button
                  onClick={() => setAddingIn(col.id)}
                  className="text-slate-500 hover:text-emerald-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
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
                  <div className="text-center py-8 text-slate-600 text-xs">
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
