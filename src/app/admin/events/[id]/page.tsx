'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EventData {
  id: string;
  name: string;
  description: string;
  eventDate: string;
  isActive: boolean;
  contestants: Array<{ id: string; name: string; age: number; course: string; year: string; photo?: string; }>;
  judges: Array<{ id: string; name: string; role: string; user?: { email: string }; }>;
  categories: Array<{ id: string; name: string; maxScore: number; weight: number; }>;
  _count: { scores: number; };
}

interface JudgeProgress {
  judgeId: string;
  name: string;
  role: string;
  contestantsDone: number;
  totalContestants: number;
  totalScored: number;
  totalPossible: number;
  percentage: number;
}

interface ProgressData {
  judgeProgress: JudgeProgress[];
  overall: { scored: number; possible: number; percentage: number; };
}

type Tab = 'contestants' | 'judges' | 'categories' | 'progress';

export default function EventManagement({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [event, setEvent]           = useState<EventData | null>(null);
  const [progress, setProgress]     = useState<ProgressData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<Tab>('contestants');
  const [deleting, setDeleting]     = useState<string | null>(null);

  // Template modals
  const [showSaveModal, setShowSaveModal]   = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [tplName, setTplName]               = useState('');
  const [tplDesc, setTplDesc]               = useState('');
  const [tplSaving, setTplSaving]           = useState(false);
  const [tplError, setTplError]             = useState('');
  const [templates, setTemplates]           = useState<Array<{ id: string; name: string; description: string | null; categories: Array<{ name: string; maxScore: number; weight: number }> }>>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [applyingTpl, setApplyingTpl]       = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    const role = (session?.user as any)?.role;
    if (!session || role !== 'ADMIN') { router.push('/auth/signin'); return; }
    fetchAll();
  }, [session, status, params.id]);

  // Refresh progress every 10s when on progress tab
  useEffect(() => {
    if (activeTab !== 'progress') return;
    fetchProgress();
    const t = setInterval(fetchProgress, 10_000);
    return () => clearInterval(t);
  }, [activeTab, params.id]);

  const fetchAll = async () => {
    await Promise.all([fetchEvent(), fetchProgress()]);
  };

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/admin/events/${params.id}`);
      if (res.ok) setEvent(await res.json());
      else if (res.status === 404) router.push('/admin');
    } catch {} finally { setLoading(false); }
  };

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/events/${params.id}/progress`);
      if (res.ok) setProgress(await res.json());
    } catch {}
  }, [params.id]);

  const deleteContestant = async (id: string) => {
    if (!confirm('Delete this contestant? All their scores will also be deleted.')) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/events/${params.id}/contestants/${id}`, { method: 'DELETE' });
    if (res.ok) fetchEvent(); else alert((await res.json()).error || 'Failed');
    setDeleting(null);
  };

  const deleteJudge = async (id: string) => {
    if (!confirm('Delete this judge? All their scores will also be deleted.')) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/events/${params.id}/judges/${id}`, { method: 'DELETE' });
    if (res.ok) fetchEvent(); else alert((await res.json()).error || 'Failed');
    setDeleting(null);
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? All scores in this category will also be deleted.')) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/events/${params.id}/categories/${id}`, { method: 'DELETE' });
    if (res.ok) fetchEvent(); else alert((await res.json()).error || 'Failed');
    setDeleting(null);
  };

  const openSaveModal = () => {
    setTplName('');
    setTplDesc('');
    setTplError('');
    setShowSaveModal(true);
  };

  const handleSaveAsTemplate = async () => {
    if (!tplName.trim()) { setTplError('Template name is required.'); return; }
    if (!event || event.categories.length === 0) { setTplError('This event has no categories to save.'); return; }
    setTplSaving(true);
    setTplError('');
    const res = await fetch('/api/admin/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: tplName.trim(),
        description: tplDesc.trim() || null,
        categories: event.categories.map(c => ({ name: c.name, maxScore: c.maxScore, weight: c.weight })),
      }),
    });
    if (res.ok) {
      setShowSaveModal(false);
    } else {
      const d = await res.json().catch(() => ({}));
      setTplError(d.error ?? 'Failed to save template.');
    }
    setTplSaving(false);
  };

  const openApplyModal = async () => {
    setTplError('');
    setShowApplyModal(true);
    setLoadingTemplates(true);
    const res = await fetch('/api/admin/templates');
    if (res.ok) setTemplates(await res.json());
    setLoadingTemplates(false);
  };

  const handleApplyTemplate = async (templateId: string) => {
    const hasCategories = event && event.categories.length > 0;
    const hasScores = event && event._count.scores > 0;

    if (hasScores) {
      alert('Cannot apply a template — scores already exist for this event. Remove all scores first.');
      return;
    }

    const replace = hasCategories
      ? confirm('This event already has categories. Replace them all with the template?')
      : false;

    setApplyingTpl(templateId);
    const res = await fetch(`/api/admin/events/${params.id}/apply-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, replace }),
    });

    if (res.ok) {
      setShowApplyModal(false);
      fetchEvent();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? 'Failed to apply template.');
    }
    setApplyingTpl(null);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="w-10 h-10 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!event) return null;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'contestants', label: 'Contestants', count: event.contestants.length },
    { id: 'judges',      label: 'Judges',      count: event.judges.length },
    { id: 'categories',  label: 'Categories',  count: event.categories.length },
    { id: 'progress',    label: 'Progress',    count: progress?.overall.percentage },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">

      {/* Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border)] shadow-[var(--shadow-sm)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push('/admin')}
                className="btn-secondary p-2 shrink-0"
                aria-label="Back"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-xl font-bold text-[var(--text-primary)] truncate">{event.name}</h1>
                  {event.isActive && <span className="badge-active shrink-0">Active</span>}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {event.description} · {new Date(event.eventDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => window.open(`/live?eventId=${event.id}`, '_blank')}
                className="relative py-2 px-3 text-sm rounded-lg font-semibold border transition-all duration-200
                  bg-gradient-to-r from-gold-500 to-amber-400 text-white border-transparent
                  hover:from-gold-400 hover:to-amber-300 flex items-center gap-1.5 shadow-sm
                  ring-1 ring-gold-400/30"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Stage
                {event.isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                )}
              </button>
              {event._count.scores > 0 && (
                <>
                  <button
                    onClick={() => router.push(`/admin/events/${event.id}/analytics`)}
                    className="py-2 px-3 text-sm rounded-lg font-medium border transition-all duration-200
                      bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400
                      border-violet-200 dark:border-violet-800 hover:bg-violet-100"
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => router.push(`/admin/events/${event.id}/results`)}
                    className="py-2 px-3 text-sm rounded-lg font-medium border transition-all duration-200
                      bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400
                      border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                  >
                    Results
                  </button>
                  <button
                    onClick={() => router.push(`/admin/events/${event.id}/report`)}
                    className="btn-primary py-2 px-3 text-sm"
                  >
                    Report
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="flex space-x-1 min-w-max py-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-2 px-4 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === tab.id
                      ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                      : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                  }`}>
                    {tab.id === 'progress' ? `${tab.count}%` : tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div layoutId="admin-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">

          {/* ── Contestants ── */}
          {activeTab === 'contestants' && (
            <motion.div key="contestants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-[var(--text-primary)]">
                  Contestants <span className="text-[var(--text-muted)] font-normal">({event.contestants.length})</span>
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/admin/events/${event.id}/import?type=contestants`)}
                    className="btn-secondary py-2 px-3 text-sm"
                  >
                    Import CSV
                  </button>
                  <button
                    onClick={() => router.push(`/admin/events/${event.id}/contestants/new`)}
                    className="btn-primary py-2 px-3 text-sm"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {event.contestants.length === 0 ? (
                <EmptyState icon="👸" message="No contestants yet" action={() => router.push(`/admin/events/${event.id}/contestants/new`)} actionLabel="Add First Contestant" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {event.contestants.sort((a, b) => a.name.localeCompare(b.name)).map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card">
                      <div className="flex gap-3 mb-3">
                        {c.photo ? (
                          <img src={c.photo} alt={c.name} className="w-14 h-20 rounded-lg object-cover shrink-0 ring-1 ring-[var(--border)]" />
                        ) : (
                          <div className="w-14 h-20 rounded-lg shrink-0 bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/20 dark:to-gold-800/20 flex items-center justify-center ring-1 ring-[var(--border)]">
                            <span className="text-2xl">👸</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="badge-gold mb-1">Candidate {i + 1}</span>
                          <h3 className="font-semibold text-[var(--text-primary)] text-sm truncate">{c.name}</h3>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{c.course}</p>
                          <p className="text-xs text-[var(--text-muted)]">{c.year} · Age {c.age}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => router.push(`/admin/events/${event.id}/contestants/${c.id}/edit`)}
                          className="flex-1 btn-secondary py-1.5 text-xs">Edit</button>
                        <button onClick={() => deleteContestant(c.id)} disabled={deleting === c.id}
                          className="px-3 py-1.5 text-xs rounded-lg font-medium border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all disabled:opacity-50">
                          {deleting === c.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Judges ── */}
          {activeTab === 'judges' && (
            <motion.div key="judges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-[var(--text-primary)]">
                  Judges <span className="text-[var(--text-muted)] font-normal">({event.judges.length})</span>
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/admin/events/${event.id}/import?type=judges`)}
                    className="btn-secondary py-2 px-3 text-sm"
                  >
                    Import CSV
                  </button>
                  <button
                    onClick={() => router.push(`/admin/events/${event.id}/judges/new`)}
                    className="btn-primary py-2 px-3 text-sm"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {event.judges.length === 0 ? (
                <EmptyState icon="⚖️" message="No judges yet" action={() => router.push(`/admin/events/${event.id}/judges/new`)} actionLabel="Add First Judge" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {event.judges.map((j, i) => (
                    <motion.div key={j.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{i + 1}</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-[var(--text-primary)] text-sm">{j.name}</h3>
                          <p className="text-xs text-[var(--text-muted)] truncate">{j.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => router.push(`/admin/events/${event.id}/judges/${j.id}/edit`)}
                          className="flex-1 btn-secondary py-1.5 text-xs">Edit</button>
                        <button onClick={() => deleteJudge(j.id)} disabled={deleting === j.id}
                          className="px-3 py-1.5 text-xs rounded-lg font-medium border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all disabled:opacity-50">
                          {deleting === j.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Categories ── */}
          {activeTab === 'categories' && (
            <motion.div key="categories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                <h2 className="font-semibold text-[var(--text-primary)]">
                  Categories <span className="text-[var(--text-muted)] font-normal">({event.categories.length})</span>
                </h2>
                <div className="flex gap-2">
                  <button onClick={openApplyModal}
                    className="py-2 px-3 text-sm rounded-lg font-medium border transition-all duration-200
                      bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400
                      border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/30
                      flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Apply Template
                  </button>
                  {event.categories.length > 0 && (
                    <button onClick={openSaveModal}
                      className="py-2 px-3 text-sm rounded-lg font-medium border transition-all duration-200
                        bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400
                        border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30
                        flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save as Template
                    </button>
                  )}
                  <button onClick={() => router.push(`/admin/events/${event.id}/categories/new`)}
                    className="btn-primary py-2 px-3 text-sm">+ Add</button>
                </div>
              </div>

              {/* Weight validation */}
              {event.categories.length > 0 && (() => {
                const totalWeight = event.categories.reduce((s, c) => s + c.weight, 0);
                const isValid = Math.abs(totalWeight - 1) < 0.01;
                return !isValid ? (
                  <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Category weights total {(totalWeight * 100).toFixed(0)}% — should sum to 100% for accurate scoring.
                    </p>
                  </div>
                ) : null;
              })()}

              {event.categories.length === 0 ? (
                <EmptyState icon="📋" message="No categories yet" action={() => router.push(`/admin/events/${event.id}/categories/new`)} actionLabel="Add First Category" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {event.categories.map((cat, i) => (
                    <motion.div key={cat.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-[var(--text-primary)]">{cat.name}</h3>
                        <span className="badge bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 shrink-0 ml-2">
                          {(cat.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      {/* Weight bar */}
                      <div className="mb-3">
                        <div className="w-full bg-[var(--bg-muted)] rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all"
                            style={{ width: `${cat.weight * 100}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-3">
                        <span>Max Score</span>
                        <span className="score-number font-bold text-[var(--text-primary)]">{cat.maxScore}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => router.push(`/admin/events/${event.id}/categories/${cat.id}/edit`)}
                          className="flex-1 btn-secondary py-1.5 text-xs">Edit</button>
                        <button onClick={() => deleteCategory(cat.id)} disabled={deleting === cat.id}
                          className="px-3 py-1.5 text-xs rounded-lg font-medium border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all disabled:opacity-50">
                          {deleting === cat.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Judge Progress ── */}
          {activeTab === 'progress' && (
            <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-[var(--text-primary)]">Scoring Progress</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Updates every 10 seconds</p>
                </div>
                <button onClick={fetchProgress} className="btn-secondary py-2 px-3 text-sm">Refresh</button>
              </div>

              {!progress ? (
                <div className="text-center py-12 text-[var(--text-muted)]">Loading progress…</div>
              ) : (
                <div className="space-y-6">
                  {/* Overall progress */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-[var(--text-primary)]">Overall Completion</h3>
                      <span className="score-number text-3xl font-bold text-emerald-500">{progress.overall.percentage}%</span>
                    </div>
                    <div className="w-full bg-[var(--bg-muted)] rounded-full h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.overall.percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                      />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {progress.overall.scored} of {progress.overall.possible} scores submitted
                    </p>
                  </div>

                  {/* Per-judge breakdown */}
                  <div className="space-y-3">
                    {progress.judgeProgress.map((jp, i) => (
                      <motion.div
                        key={jp.judgeId}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="card"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{i + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-[var(--text-primary)] text-sm">{jp.name}</span>
                              <span className={`score-number text-sm font-bold ${jp.percentage === 100 ? 'text-emerald-500' : 'text-[var(--text-primary)]'}`}>
                                {jp.percentage}%
                              </span>
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">{jp.role}</p>
                          </div>
                        </div>
                        <div className="w-full bg-[var(--bg-muted)] rounded-full h-1.5 mb-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${jp.percentage}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.06 }}
                            className={`h-1.5 rounded-full ${jp.percentage === 100 ? 'bg-emerald-500' : 'bg-violet-500'}`}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                          <span>{jp.contestantsDone}/{jp.totalContestants} contestants scored</span>
                          {jp.percentage === 100 && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Complete
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {progress.judgeProgress.length === 0 && (
                      <div className="text-center py-8 text-[var(--text-muted)]">No judges assigned yet</div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Save as Template Modal ── */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowSaveModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-2xl w-full max-w-md">
              <div className="px-6 pt-6 pb-4 border-b border-[var(--border)]">
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Save as Template</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Saves the {event.categories.length} current {event.categories.length === 1 ? 'category' : 'categories'} as a reusable template.
                </p>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                    Template Name *
                  </label>
                  <input value={tplName} onChange={e => setTplName(e.target.value)}
                    placeholder="e.g. Standard Pageant Format"
                    className="form-input" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                    Description
                  </label>
                  <input value={tplDesc} onChange={e => setTplDesc(e.target.value)}
                    placeholder="Optional note about this template"
                    className="form-input" />
                </div>
                {tplError && (
                  <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2">{tplError}</p>
                )}
              </div>
              <div className="px-6 pb-6 flex gap-2 justify-end">
                <button onClick={() => setShowSaveModal(false)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
                <button onClick={handleSaveAsTemplate} disabled={tplSaving}
                  className="py-2 px-4 text-sm rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-60">
                  {tplSaving ? 'Saving…' : 'Save Template'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Apply Template Modal ── */}
      <AnimatePresence>
        {showApplyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowApplyModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-2xl w-full max-w-md">
              <div className="px-6 pt-6 pb-4 border-b border-[var(--border)]">
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Apply Template</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">Choose a template to load its categories into this event.</p>
              </div>
              <div className="px-6 py-4 max-h-80 overflow-y-auto">
                {loadingTemplates ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[var(--text-secondary)] text-sm">No templates yet.</p>
                    <button onClick={() => { setShowApplyModal(false); router.push('/admin/templates'); }}
                      className="mt-3 text-xs text-violet-500 hover:text-violet-700 font-medium">
                      Create your first template →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.map(t => (
                      <button key={t.id} onClick={() => handleApplyTemplate(t.id)}
                        disabled={applyingTpl === t.id}
                        className="w-full text-left px-4 py-3 rounded-xl border border-[var(--border)]
                          bg-[var(--bg-base)] hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20
                          transition-all duration-200 disabled:opacity-50 group">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm text-[var(--text-primary)] group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
                              {t.name}
                            </p>
                            {t.description && (
                              <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.description}</p>
                            )}
                          </div>
                          <span className="text-xs text-[var(--text-muted)] shrink-0 ml-3">
                            {applyingTpl === t.id ? 'Applying…' : `${t.categories.length} cat.`}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-6 pb-5 pt-3 border-t border-[var(--border)] flex justify-between items-center">
                <button onClick={() => { setShowApplyModal(false); router.push('/admin/templates'); }}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  Manage templates →
                </button>
                <button onClick={() => setShowApplyModal(false)} className="btn-secondary py-2 px-4 text-sm">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ icon, message, action, actionLabel }: { icon: string; message: string; action: () => void; actionLabel: string }) {
  return (
    <div className="card text-center py-14">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-[var(--text-secondary)] font-medium">{message}</p>
      <button onClick={action} className="btn-primary mt-5 py-2 px-5 text-sm">{actionLabel}</button>
    </div>
  );
}
