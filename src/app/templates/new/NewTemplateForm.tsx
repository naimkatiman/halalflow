'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash, ArrowLeft, ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { fetchWithCsrf } from '@/lib/csrf-client';

interface Step {
  name: string;
  description: string;
  requiredRole?: string;
}

export function NewTemplateForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<Step[]>([{ name: '', description: '', requiredRole: '' }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addStep = () => setSteps([...steps, { name: '', description: '', requiredRole: '' }]);

  const removeStep = (i: number) => {
    if (steps.length === 1) return;
    setSteps(steps.filter((_, idx) => idx !== i));
  };

  const moveStep = (i: number, dir: -1 | 1) => {
    const next = i + dir;
    if (next < 0 || next >= steps.length) return;
    const updated = [...steps];
    [updated[i], updated[next]] = [updated[next], updated[i]];
    setSteps(updated);
  };

  const updateStep = (i: number, field: keyof Step, value: string) => {
    const updated = [...steps];
    updated[i] = { ...updated[i], [field]: value };
    setSteps(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (steps.some((s) => !s.name.trim())) {
      setError('All steps must have a name');
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithCsrf('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          steps: steps.map((s, i) => ({ name: s.name.trim(), description: s.description || undefined, order: i, requiredRole: s.requiredRole || undefined })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create template');
        return;
      }
      router.push('/templates');
      router.refresh();
    } catch (err) {
      console.error('NewTemplateForm submit error:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/templates" aria-label="Go back" className="text-zinc-400 hover:text-zinc-700 transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
        <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">New Template</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-zinc-200/70 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-950 text-sm">Details</h2>
          <div>
            <label htmlFor="template-name" className="block text-sm font-medium text-zinc-700 mb-1.5">Template name</label>
            <input
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              placeholder="Mosque Expense Approval"
            />
          </div>
          <div>
            <label htmlFor="template-description" className="block text-sm font-medium text-zinc-700 mb-1.5">Description <span className="text-zinc-400 font-normal">(optional)</span></label>
            <textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none"
              placeholder="Used for all operational expense requests above RM 500"
            />
          </div>
        </div>

        <div className="bg-white border border-zinc-200/70 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-950 text-sm">Approval steps</h2>
            <button
              type="button"
              onClick={addStep}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" weight="bold" aria-hidden="true" />
              Add step
            </button>
          </div>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex flex-col gap-1 pt-2">
                  <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} aria-label="Move step up" className="text-zinc-300 hover:text-zinc-600 disabled:opacity-30 transition-colors">
                    <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} aria-label="Move step down" className="text-zinc-300 hover:text-zinc-600 disabled:opacity-30 transition-colors">
                    <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-medium w-5">{i + 1}.</span>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => updateStep(i, 'name', e.target.value)}
                      required
                      maxLength={100}
                      aria-label={`Step ${i + 1} name`}
                      className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                      placeholder={`Step name (e.g. "Finance Officer Review")`}
                    />
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      disabled={steps.length === 1}
                      aria-label="Remove step"
                      className="text-zinc-300 hover:text-red-500 disabled:opacity-30 transition-colors p-1"
                    >
                      <Trash className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={step.description}
                    onChange={(e) => updateStep(i, 'description', e.target.value)}
                    aria-label={`Step ${i + 1} description`}
                    className="w-full ml-5 px-3 py-1.5 border border-zinc-100 rounded-lg text-xs text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                    placeholder="Step description (optional)"
                  />
                  <select
                    value={step.requiredRole || ''}
                    onChange={(e) => updateStep(i, 'requiredRole', e.target.value)}
                    aria-label={`Step ${i + 1} required role`}
                    className="w-full ml-5 px-3 py-1.5 border border-zinc-100 rounded-lg text-xs text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-white"
                  >
                    <option value="">Any member can approve</option>
                    <option value="owner">Owner only</option>
                    <option value="admin">Admin or above</option>
                    <option value="member">Member or above</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2" role="alert">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Creating…' : 'Create template'}
          </button>
          <Link href="/templates" className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
