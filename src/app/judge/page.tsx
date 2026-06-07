'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

interface JudgeEventData {
  event: {
    id: string;
    name: string;
    description: string;
    eventDate: string;
    contestants: Array<{ id: string; name: string; age: number; course: string; year: string; photo?: string; }>;
    categories: Array<{ id: string; name: string; maxScore: number; weight: number; }>;
  };
  judgeId: string;
  scores: Array<{ contestantId: string; categoryId: string; score: number; }>;
}

function ScoringStatusIcon({ complete }: { complete: boolean }) {
  if (complete) {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full border-2 border-dashed border-[var(--border)] flex items-center justify-center shrink-0">
      <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </div>
  );
}

export default function JudgeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [eventData, setEventData] = useState<JudgeEventData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    const role = (session?.user as any)?.role;
    if (!session || role !== 'JUDGE') { router.push('/auth/signin'); return; }
    fetchData();
  }, [session, status]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/judge/event-data');
      if (res.ok) setEventData(await res.json());
      else if (res.status === 404) setError('No active event found or you are not assigned as a judge');
      else setError('Failed to load event data');
    } catch { setError('Failed to load event data'); }
    finally { setLoading(false); }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="w-10 h-10 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="text-center max-w-sm px-4">
          <div className="text-4xl mb-3">⚖️</div>
          <h1 className="font-semibold text-[var(--text-primary)] mb-2">{error || 'No Event Available'}</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            {error === 'No active event found or you are not assigned as a judge'
              ? 'You are not currently assigned to judge any active event. Contact the administrator.'
              : 'Unable to load event data at this time.'}
          </p>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-secondary py-2 px-5 text-sm">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const { event, scores } = eventData;
  const totalPossible    = event.contestants.length * event.categories.length;
  const totalScored      = scores.length;
  const completionPct    = totalPossible > 0 ? Math.round((totalScored / totalPossible) * 100) : 0;

  const getScore = (contestantId: string, categoryId: string) =>
    scores.find(s => s.contestantId === contestantId && s.categoryId === categoryId)?.score ?? 0;

  const isComplete = (contestantId: string) =>
    event.categories.every(cat => getScore(contestantId, cat.id) > 0);

  const completedCount   = event.contestants.filter(c => isComplete(c.id)).length;
  const pendingCount     = event.contestants.length - completedCount;

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">

      {/* Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border)] shadow-[var(--shadow-sm)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">Judge Dashboard</h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{event.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] hidden sm:block">{session?.user?.name}</span>
              <ThemeToggle />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-400 transition-all"
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Progress card */}
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">Your Scoring Progress</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {completedCount} of {event.contestants.length} contestants fully scored
              </p>
            </div>
            <div className="text-right">
              <div className={`score-number text-4xl font-bold ${completionPct === 100 ? 'text-emerald-500' : 'text-violet-500'}`}>
                {completionPct}%
              </div>
              <div className="text-xs text-[var(--text-muted)]">Complete</div>
            </div>
          </div>
          <div className="w-full bg-[var(--bg-muted)] rounded-full h-2.5 mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-2.5 rounded-full ${completionPct === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-violet-400 to-violet-600'}`}
            />
          </div>
          <div className="flex gap-4 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {completedCount} done
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--border)]" />
              {pendingCount} pending
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              {event.categories.length} categories
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Contestants', value: event.contestants.length, color: 'text-[var(--text-primary)]' },
            { label: 'Categories',  value: event.categories.length,  color: 'text-gold-500' },
            { label: 'Scores Done', value: totalScored,              color: 'text-violet-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="card text-center py-4">
              <div className={`score-number text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Contestant grid */}
        <div>
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">Score Contestants</h2>
          {event.contestants.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">👸</div>
              <p className="text-[var(--text-muted)]">No contestants added yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {event.contestants.map((contestant, i) => {
                const done = isComplete(contestant.id);
                const catScores = event.categories.map(cat => ({
                  cat,
                  score: getScore(contestant.id, cat.id),
                }));
                const scoredCats = catScores.filter(x => x.score > 0).length;

                return (
                  <motion.div
                    key={contestant.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`card-hover ${done ? 'border-emerald-300 dark:border-emerald-700' : ''}`}
                  >
                    {/* Contestant info */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative shrink-0">
                        {contestant.photo ? (
                          <img src={contestant.photo} alt={contestant.name}
                            className={`w-14 h-20 rounded-lg object-cover ring-2 ${done ? 'ring-emerald-400' : 'ring-[var(--border)]'}`} />
                        ) : (
                          <div className={`w-14 h-20 rounded-lg flex items-center justify-center ring-2 ${done ? 'ring-emerald-400' : 'ring-[var(--border)]'} bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/20 dark:to-gold-800/20`}>
                            <span className="text-2xl">👸</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--text-primary)] text-sm truncate">{contestant.name}</h3>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{contestant.course}</p>
                        <p className="text-xs text-[var(--text-muted)]">{contestant.year} · Age {contestant.age}</p>
                        <div className="mt-1.5 flex items-center gap-1">
                          <div className="flex-1 bg-[var(--bg-muted)] rounded-full h-1">
                            <div
                              className={`h-1 rounded-full transition-all duration-300 ${done ? 'bg-emerald-500' : 'bg-violet-500'}`}
                              style={{ width: `${event.categories.length > 0 ? (scoredCats / event.categories.length) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--text-muted)] shrink-0">{scoredCats}/{event.categories.length}</span>
                        </div>
                      </div>
                      <ScoringStatusIcon complete={done} />
                    </div>

                    {/* Category score chips */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {catScores.map(({ cat, score }) => (
                        <span key={cat.id}
                          className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                            score > 0
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                              : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                          }`}
                        >
                          {cat.name.length > 10 ? cat.name.slice(0, 10) + '…' : cat.name}
                          {score > 0 && <span className="ml-1 score-number">{score}</span>}
                        </span>
                      ))}
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => router.push(`/judge/score/${contestant.id}`)}
                      className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                        done
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                          : 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm'
                      }`}
                    >
                      {done ? '✓ Review / Edit Scores' : 'Score Contestant'}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
