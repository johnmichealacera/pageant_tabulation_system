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
            {event._count.scores > 0 && (
              <div className="flex gap-2 shrink-0">
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
              </div>
            )}
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
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-[var(--text-primary)]">
                  Categories <span className="text-[var(--text-muted)] font-normal">({event.categories.length})</span>
                </h2>
                <button onClick={() => router.push(`/admin/events/${event.id}/categories/new`)}
                  className="btn-primary py-2 px-3 text-sm">+ Add</button>
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
