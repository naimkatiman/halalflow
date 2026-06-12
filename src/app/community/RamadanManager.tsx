'use client';

import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf-client';
import { RAMADAN_TYPES, RAMADAN_TYPE_LABELS } from '@/lib/community';

interface Program {
  id: string;
  type: string;
  title?: string | null;
  description: string;
  time?: string | null;
  schedule?: string | null;
  isFree: boolean;
  sponsorName?: string | null;
}

interface RamadanManagerProps {
  initial: Program[];
}

interface EditState {
  type: string;
  title: string;
  description: string;
  time: string;
  schedule: string;
  isFree: boolean;
  sponsorName: string;
}

function emptyEdit(): EditState {
  return { type: RAMADAN_TYPES[0], title: '', description: '', time: '', schedule: '', isFree: true, sponsorName: '' };
}

export function RamadanManager({ initial }: RamadanManagerProps) {
  const [programs, setPrograms] = useState<Program[]>(initial);
  const [editId, setEditId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>(emptyEdit());
  const [addState, setAddState] = useState<EditState>(emptyEdit());
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Track which row is pending delete confirmation
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const inputCls = 'w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors';

  const startEdit = (p: Program) => {
    setEditId(p.id);
    setEditState({
      type: p.type,
      title: p.title ?? '',
      description: p.description,
      time: p.time ?? '',
      schedule: p.schedule ?? '',
      isFree: p.isFree,
      sponsorName: p.sponsorName ?? '',
    });
    setError('');
    setConfirmingId(null);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    if (!editState.description.trim()) { setError('Keterangan diperlukan'); return; }
    setError('');
    setLoading(true);
    try {
      const body = {
        type: editState.type,
        title: editState.title.trim(),
        description: editState.description.trim(),
        time: editState.time.trim(),
        schedule: editState.schedule.trim(),
        isFree: editState.isFree,
        sponsorName: editState.sponsorName.trim(),
      };
      const res = await fetchWithCsrf(`/api/community/ramadan/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gagal menyimpan'); return; }
      setPrograms((prev) => prev.map((p) => (p.id === editId ? data.data : p)));
      setEditId(null);
    } catch {
      setError('Ralat rangkaian — cuba semula');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetchWithCsrf(`/api/community/ramadan/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Gagal memadam');
        return;
      }
      setPrograms((prev) => prev.filter((p) => p.id !== id));
      if (editId === id) setEditId(null);
      setConfirmingId(null);
    } catch {
      setError('Ralat rangkaian — cuba semula');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addState.description.trim()) { setError('Keterangan diperlukan'); return; }
    setError('');
    setLoading(true);
    try {
      const body = {
        type: addState.type,
        title: addState.title.trim(),
        description: addState.description.trim(),
        time: addState.time.trim(),
        schedule: addState.schedule.trim(),
        isFree: addState.isFree,
        sponsorName: addState.sponsorName.trim(),
      };
      const res = await fetchWithCsrf('/api/community/ramadan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gagal menambah'); return; }
      setPrograms((prev) => [...prev, data.data]);
      setAddState(emptyEdit());
      setShowAdd(false);
    } catch {
      setError('Ralat rangkaian — cuba semula');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200/70 rounded-xl">
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
        <h2 className="font-semibold text-zinc-950">Program Ramadan</h2>
        <button
          type="button"
          onClick={() => { setShowAdd((v) => !v); setError(''); }}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:border-emerald-300 px-3 py-1.5 rounded-lg transition-colors"
        >
          {showAdd ? 'Tutup' : '+ Tambah program'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border-b border-red-100 px-6 py-3" role="alert">{error}</p>
      )}

      {/* Program list */}
      {programs.length === 0 && !showAdd ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-zinc-500">Tiada program Ramadan didaftarkan.</p>
          <p className="text-xs text-zinc-400 mt-1">Klik &ldquo;Tambah program&rdquo; untuk bermula.</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {programs.map((p) => (
            <div key={p.id} className="px-6 py-4">
              {editId === p.id ? (
                <ProgramForm
                  idPrefix={p.id}
                  state={editState}
                  onChange={setEditState}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditId(null)}
                  loading={loading}
                  saveLabel="Simpan perubahan"
                  inputCls={inputCls}
                />
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {RAMADAN_TYPE_LABELS[p.type] ?? p.type}
                      </span>
                      {p.isFree && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-500 border border-zinc-200">
                          Percuma
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-700 mt-1.5">{p.description}</p>
                    {(p.time || p.schedule) && (
                      <p className="text-xs text-zinc-400 mt-1">
                        {[p.time, p.schedule].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {p.sponsorName && (
                      <p className="text-xs text-zinc-400 mt-0.5">Penaja: {p.sponsorName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="text-xs text-zinc-500 hover:text-zinc-700 border border-zinc-200 hover:border-zinc-300 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    {confirmingId === p.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          disabled={loading}
                          className="text-xs text-white bg-red-600 hover:bg-red-700 border border-red-600 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Ya, padam
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          disabled={loading}
                          className="text-xs text-zinc-500 hover:text-zinc-700 border border-zinc-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Batal
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(p.id)}
                        disabled={loading}
                        className="text-xs text-red-500 hover:text-red-700 border border-red-100 hover:border-red-200 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Padam
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="border-t border-zinc-100 px-6 py-5">
          <p className="text-sm font-semibold text-zinc-950 mb-4">Program baharu</p>
          <ProgramForm
            idPrefix="add"
            state={addState}
            onChange={setAddState}
            onSave={handleAdd}
            onCancel={() => { setShowAdd(false); setAddState(emptyEdit()); }}
            loading={loading}
            saveLabel="Tambah program"
            inputCls={inputCls}
          />
        </div>
      )}
    </div>
  );
}

interface ProgramFormProps {
  idPrefix: string;
  state: EditState;
  onChange: (s: EditState) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  saveLabel: string;
  inputCls: string;
}

function ProgramForm({ idPrefix, state, onChange, onSave, onCancel, loading, saveLabel, inputCls }: ProgramFormProps) {
  const set = (key: keyof EditState, value: string | boolean) =>
    onChange({ ...state, [key]: value });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${idPrefix}-type`} className="block text-xs font-medium text-zinc-700 mb-1">Jenis</label>
          <select id={`${idPrefix}-type`} value={state.type} onChange={(e) => set('type', e.target.value)} className={`${inputCls} bg-white`}>
            {RAMADAN_TYPES.map((t) => (
              <option key={t} value={t}>{RAMADAN_TYPE_LABELS[t] ?? t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-title`} className="block text-xs font-medium text-zinc-700 mb-1">Tajuk (pilihan)</label>
          <input id={`${idPrefix}-title`} type="text" value={state.title} onChange={(e) => set('title', e.target.value)} maxLength={160} className={inputCls} placeholder="cth. Iftar Perdana" />
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-description`} className="block text-xs font-medium text-zinc-700 mb-1">Keterangan</label>
        <textarea id={`${idPrefix}-description`} value={state.description} onChange={(e) => set('description', e.target.value)} rows={2} maxLength={1000} className={`${inputCls} resize-none`} placeholder="Huraikan program ini…" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${idPrefix}-time`} className="block text-xs font-medium text-zinc-700 mb-1">Masa</label>
          <input id={`${idPrefix}-time`} type="text" value={state.time} onChange={(e) => set('time', e.target.value)} maxLength={60} className={inputCls} placeholder="18:45" />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-schedule`} className="block text-xs font-medium text-zinc-700 mb-1">Jadual</label>
          <input id={`${idPrefix}-schedule`} type="text" value={state.schedule} onChange={(e) => set('schedule', e.target.value)} maxLength={120} className={inputCls} placeholder="Setiap hari Ramadan" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input id={`${idPrefix}-is-free`} type="checkbox" checked={state.isFree} onChange={(e) => set('isFree', e.target.checked)} className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500" />
          <label htmlFor={`${idPrefix}-is-free`} className="text-sm font-medium text-zinc-700">Percuma</label>
        </div>
        {!state.isFree && (
          <div className="flex-1">
            <label htmlFor={`${idPrefix}-sponsor`} className="sr-only">Nama penaja</label>
            <input id={`${idPrefix}-sponsor`} type="text" value={state.sponsorName} onChange={(e) => set('sponsorName', e.target.value)} maxLength={160} className={inputCls} placeholder="Nama penaja" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {loading ? 'Menyimpan…' : saveLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={loading} className="text-sm text-zinc-500 hover:text-zinc-700">Batal</button>
      </div>
    </div>
  );
}
