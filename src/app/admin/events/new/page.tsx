'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Template {
  id: string;
  name: string;
  description: string | null;
  categories: Array<{ name: string; maxScore: number; weight: number }>;
}

export default function NewEvent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading]           = useState(false);
  const [formData, setFormData]         = useState({ name: '', description: '', eventDate: '' });
  const [templates, setTemplates]       = useState<Template[]>([]);
  const [selectedTpl, setSelectedTpl]   = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'ADMIN') router.push('/auth/signin');
    fetch('/api/admin/templates').then(r => r.ok ? r.json() : []).then(setTemplates);
  }, [session, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) { alert((await res.json()).error || 'Failed to create event'); return; }

      const event = await res.json();

      if (selectedTpl) {
        await fetch(`/api/admin/events/${event.id}/apply-template`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId: selectedTpl, replace: false }),
        });
      }

      router.push(`/admin/events/${event.id}`);
    } catch { alert('Failed to create event'); }
    finally { setLoading(false); }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const chosen = templates.find(t => t.id === selectedTpl);

  if (status === 'loading') return null;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-start justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">

        <div className="mb-8">
          <button onClick={() => router.push('/admin')} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Create Event</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Set up a new pageant scoring event</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Event Name *</label>
            <input type="text" required value={formData.name} onChange={set('name')}
              placeholder="e.g., Miss Campus 2025"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]
                text-[var(--text-primary)] placeholder-[var(--text-muted)]
                focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
            <textarea rows={3} value={formData.description} onChange={set('description')}
              placeholder="Brief description of the event..."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]
                text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none
                focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Event Date *</label>
            <input type="date" required value={formData.eventDate} onChange={set('eventDate')}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]
                text-[var(--text-primary)]
                focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all" />
          </div>

          {/* Template picker */}
          {templates.length > 0 && (
            <div className="border-t border-[var(--border)] pt-5">
              <button
                type="button"
                onClick={() => setShowTemplates(v => !v)}
                className="w-full flex items-center justify-between text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Starting Template
                  {chosen && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">
                      {chosen.name}
                    </span>
                  )}
                </span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${showTemplates ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {showTemplates && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-[var(--text-muted)] mt-3 mb-3">
                      Optionally pre-load a category set. You can add or edit categories after the event is created.
                    </p>
                    <div className="space-y-2">
                      {/* None option */}
                      <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                        !selectedTpl
                          ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20'
                          : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                      }`}>
                        <input type="radio" name="template" value="" checked={!selectedTpl}
                          onChange={() => setSelectedTpl('')} className="accent-rose-500" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">No template</p>
                          <p className="text-xs text-[var(--text-muted)]">Add categories manually after creating the event</p>
                        </div>
                      </label>

                      {templates.map(t => (
                        <label key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                          selectedTpl === t.id
                            ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                            : 'border-[var(--border)] hover:border-violet-300'
                        }`}>
                          <input type="radio" name="template" value={t.id} checked={selectedTpl === t.id}
                            onChange={() => setSelectedTpl(t.id)} className="accent-violet-500 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-[var(--text-primary)]">{t.name}</p>
                              <span className="text-xs text-[var(--text-muted)]">{t.categories.length} categories</span>
                            </div>
                            {t.description && (
                              <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.description}</p>
                            )}
                            {selectedTpl === t.id && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {t.categories.map(c => (
                                  <span key={c.name} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border)]">
                                    {c.name} · {(c.weight * 100).toFixed(0)}%
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => router.push('/admin')} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary py-2 px-5 text-sm disabled:opacity-50">
              {loading ? (selectedTpl ? 'Creating & applying template…' : 'Creating…') : 'Create Event'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
