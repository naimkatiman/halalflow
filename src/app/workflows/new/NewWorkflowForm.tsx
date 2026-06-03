'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react';
import { fetchWithCsrf } from '@/lib/csrf-client';

interface Template {
  id: string;
  name: string;
  description?: string;
  steps: { id: string; name: string; order: number }[];
}

export function NewWorkflowForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('templateId') ?? '';

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState(preselectedId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((d) => {
        setTemplates(d.templates ?? []);
        if (preselectedId) setTemplateId(preselectedId);
        else if (d.templates?.length > 0) {
          setTemplateId((prev) => prev || d.templates[0].id);
        }
      })
      .catch((err) => { console.error('NewWorkflowForm template fetch failed:', err); });
  }, [preselectedId]);

  const selectedTemplate = templates.find((t) => t.id === templateId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetchWithCsrf('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, title, description: description || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create workflow');
        return;
      }
      router.push(`/workflows/${data.workflow.id}`);
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/workflows" aria-label="Go back" className="text-zinc-400 hover:text-zinc-700 transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
        <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">New Workflow</h1>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white border border-zinc-200/70 rounded-xl p-8 text-center">
          <p className="text-sm text-zinc-500 mb-3">You need at least one template to create a workflow.</p>
          <Link href="/templates/new" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Create a template →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-zinc-200/70 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-zinc-950 text-sm">Workflow details</h2>
            <div>
              <label htmlFor="workflow-title" className="block text-sm font-medium text-zinc-700 mb-1.5">Title</label>
              <input
                id="workflow-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                placeholder="e.g. AC Unit Replacement — Masjid Al-Noor"
              />
            </div>
            <div>
              <label htmlFor="workflow-description" className="block text-sm font-medium text-zinc-700 mb-1.5">Description <span className="text-zinc-400 font-normal">(optional)</span></label>
              <textarea
                id="workflow-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none"
                placeholder="Provide context for reviewers…"
              />
            </div>
            <div>
              <label htmlFor="workflow-template" className="block text-sm font-medium text-zinc-700 mb-1.5">Template</label>
              <select
                id="workflow-template"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-white"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedTemplate && (
            <div className="bg-zinc-50 border border-zinc-200/70 rounded-xl p-5">
              <h2 className="font-semibold text-zinc-950 text-sm mb-3">Approval steps for this workflow</h2>
              <div className="space-y-2">
                {selectedTemplate.steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-600 text-xs font-semibold flex items-center justify-center shrink-0">
                      {step.order + 1}
                    </span>
                    <span className="text-sm text-zinc-700">{step.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2" role="alert">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Creating…' : 'Start workflow'}
            </button>
            <Link href="/workflows" className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
