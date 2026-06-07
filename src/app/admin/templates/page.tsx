'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

interface TemplateCategory {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
}

interface EventTemplate {
  id: string;
  name: string;
  description: string | null;
  categories: TemplateCategory[];
  createdAt: string;
}

const BLANK_CAT = { name: '', maxScore: 25, weight: 0.2 };

export default function TemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);

  // Create / Edit modal
  const [modal, setModal]   = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<EventTemplate | null>(null);
  const [tplName, setTplName]   = useState('');
  const [tplDesc, setTplDesc]   = useState('');
  const [tplCats, setTplCats]   = useState([{ ...BLANK_CAT }]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'ADMIN') { router.push('/auth/signin'); return; }
    fetchTemplates();
  }, [session, status]);

  const fetchTemplates = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/templates');
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setTplName('');
    setTplDesc('');
    setTplCats([{ ...BLANK_CAT }]);
    setError('');
    setModal('create');
  };

  const openEdit = (t: EventTemplate) => {
    setEditing(t);
    setTplName(t.name);
    setTplDesc(t.description ?? '');
    setTplCats(t.categories.map(c => ({ name: c.name, maxScore: c.maxScore, weight: c.weight })));
    setError('');
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditing(null); };

  const addCat    = () => setTplCats(prev => [...prev, { ...BLANK_CAT }]);
  const removeCat = (i: number) => setTplCats(prev => prev.filter((_, idx) => idx !== i));
  const updateCat = (i: number, field: string, value: string | number) =>
    setTplCats(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const totalWeight = tplCats.reduce((s, c) => s + Number(c.weight), 0);
  const weightOk    = Math.abs(totalWeight - 1) < 0.01;

  const handleSave = async () => {
    if (!tplName.trim()) { setError('Template name is required.'); return; }
    if (tplCats.length === 0) { setError('Add at least one category.'); return; }
    if (!weightOk) { setError(`Weights total ${(totalWeight * 100).toFixed(0)}% — must equal 100%.`); return; }
    setSaving(true);
    setError('');

    const url    = modal === 'edit' ? `/api/admin/templates/${editing!.id}` : '/api/admin/templates';
    const method = modal === 'edit' ? 'PUT' : 'POST';
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tplName, description: tplDesc, categories: tplCats }),
    });

    if (res.ok) {
      await fetchTemplates();
      closeModal();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? 'Failed to save template.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
    setTemplates(prev => prev.filter(t => t.id !== id));
    setDeleting(null);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="w-10 h-10 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border)] shadow-[var(--shadow-sm)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin')} className="btn-secondary p-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">Event Templates</h1>
                <p className="text-xs text-[var(--text-muted)]">Reusable scoring category sets</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button onClick={openCreate} className="btn-primary py-2 px-4 text-sm">
                + New Template
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {templates.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-24">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">No templates yet</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              Create a template to reuse the same category set across multiple events.
            </p>
            <button onClick={openCreate} className="btn-primary py-2.5 px-6">Create First Template</button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {templates.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[var(--text-primary)]">{t.name}</h3>
                      <span className="badge bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400">
                        {t.categories.length} {t.categories.length === 1 ? 'category' : 'categories'}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5">{t.description}</p>
                    )}
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Created {new Date(t.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                      className="btn-secondary py-1.5 px-3 text-xs">
                      {expanded === t.id ? 'Hide' : 'Preview'}
                    </button>
                    <button onClick={() => openEdit(t)} className="btn-secondary py-1.5 px-3 text-xs">Edit</button>
                    <button onClick={() => handleDelete(t.id, t.name)} disabled={deleting === t.id}
                      className="py-1.5 px-3 text-xs rounded-lg font-medium border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all disabled:opacity-50">
                      {deleting === t.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expanded === t.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {t.categories.map(cat => (
                          <div key={cat.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-muted)]">
                            <div>
                              <p className="text-sm font-medium text-[var(--text-primary)]">{cat.name}</p>
                              <p className="text-xs text-[var(--text-muted)]">Max: {cat.maxScore}</p>
                            </div>
                            <span className="badge-gold text-xs">{(cat.weight * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={closeModal}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -12 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-2xl w-full max-w-lg">

              <div className="px-6 pt-6 pb-4 border-b border-[var(--border)]">
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  {modal === 'edit' ? 'Edit Template' : 'New Template'}
                </h2>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                    Template Name *
                  </label>
                  <input value={tplName} onChange={e => setTplName(e.target.value)}
                    placeholder="e.g. Standard Pageant, Miss Universe Format"
                    className="form-input" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                    Description
                  </label>
                  <input value={tplDesc} onChange={e => setTplDesc(e.target.value)}
                    placeholder="Optional — what events is this for?"
                    className="form-input" />
                </div>

                {/* Categories */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      Categories
                    </label>
                    <span className={`text-xs font-semibold ${weightOk ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {(totalWeight * 100).toFixed(0)}% / 100%
                    </span>
                  </div>

                  <div className="space-y-2">
                    {tplCats.map((cat, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input value={cat.name} onChange={e => updateCat(i, 'name', e.target.value)}
                          placeholder="Category name" className="form-input flex-1 min-w-0" />
                        <input type="number" value={cat.maxScore} min={1}
                          onChange={e => updateCat(i, 'maxScore', parseInt(e.target.value) || 1)}
                          className="form-input w-20 text-center" title="Max score" />
                        <div className="relative w-20">
                          <input type="number" value={(cat.weight * 100).toFixed(0)} min={1} max={100}
                            onChange={e => updateCat(i, 'weight', (parseInt(e.target.value) || 0) / 100)}
                            className="form-input w-full text-center pr-5" title="Weight %" />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">%</span>
                        </div>
                        {tplCats.length > 1 && (
                          <button onClick={() => removeCat(i)}
                            className="text-rose-400 hover:text-rose-600 transition-colors p-1 shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button onClick={addCat} className="mt-2 text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Category
                  </button>
                </div>

                {error && (
                  <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2">{error}</p>
                )}
              </div>

              <div className="px-6 pb-6 flex gap-2 justify-end">
                <button onClick={closeModal} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary py-2 px-4 text-sm disabled:opacity-60">
                  {saving ? 'Saving…' : modal === 'edit' ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
