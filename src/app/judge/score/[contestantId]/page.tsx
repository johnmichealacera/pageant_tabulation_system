'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContestantData {
  contestant: {
    id: string;
    name: string;
    age: number;
    course: string;
    year: string;
    photo?: string;
  };
  categories: Array<{
    id: string;
    name: string;
    maxScore: number;
    weight: number;
  }>;
  existingScores: Array<{
    categoryId: string;
    score: number;
  }>;
  judgeId: string;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function draftKey(contestantId: string, judgeId: string) {
  return `score_draft_${judgeId}_${contestantId}`;
}

export default function ScoreContestant({ params }: { params: { contestantId: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contestantData, setContestantData] = useState<ContestantData | null>(null);
  const [scores, setScores] = useState<{ [categoryId: string]: number }>({});
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoresRef = useRef(scores);

  useEffect(() => { scoresRef.current = scores; }, [scores]);

  useEffect(() => {
    if (status === 'loading') return;
    const role = (session?.user as any)?.role;
    if (!session || role !== 'JUDGE') { router.push('/auth/signin'); return; }
    fetchContestantData();
  }, [session, status]);

  const fetchContestantData = async () => {
    try {
      const res = await fetch(`/api/judge/contestant/${params.contestantId}`);
      if (res.ok) {
        const data: ContestantData = await res.json();
        setContestantData(data);

        // Merge: existingScores > localStorage draft > empty
        const stored = localStorage.getItem(draftKey(params.contestantId, data.judgeId));
        const draft: Record<string, number> = stored ? JSON.parse(stored) : {};

        const initial: Record<string, number> = {};
        data.existingScores.forEach(s => { initial[s.categoryId] = s.score; });
        // Draft overrides only if it has a value and no existing score
        Object.entries(draft).forEach(([catId, val]) => {
          if (!(catId in initial)) initial[catId] = val;
        });
        setScores(initial);
      } else if (res.status === 404) {
        setError('Contestant not found or you are not authorized');
      } else {
        setError('Failed to load contestant data');
      }
    } catch {
      setError('Failed to load contestant data');
    } finally {
      setLoading(false);
    }
  };

  const persistDraft = useCallback((newScores: Record<string, number>, judgeId: string) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      localStorage.setItem(draftKey(params.contestantId, judgeId), JSON.stringify(newScores));
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    }, 800);
  }, [params.contestantId]);

  const handleScoreChange = (categoryId: string, value: number) => {
    const category = contestantData?.categories.find(c => c.id === categoryId);
    if (!category) return;
    const clamped = Math.min(Math.max(0, value), category.maxScore);
    const rounded = Math.round(clamped * 2) / 2; // snap to 0.5
    const next = { ...scoresRef.current, [categoryId]: rounded };
    setScores(next);
    setSaveState('saving');
    if (contestantData) persistDraft(next, contestantData.judgeId);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!contestantData) return;
    const categories = contestantData.categories;

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Enter') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'Tab': {
          if (e.key === 'Tab' && tag === 'INPUT') return; // let browser handle
          e.preventDefault();
          setFocusedIndex(i => (i + 1) % categories.length);
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          setFocusedIndex(i => (i - 1 + categories.length) % categories.length);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const catUp = categories[focusedIndex];
          if (catUp) handleScoreChange(catUp.id, (scoresRef.current[catUp.id] || 0) + 0.5);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          const catDown = categories[focusedIndex];
          if (catDown) handleScoreChange(catDown.id, (scoresRef.current[catDown.id] || 0) - 0.5);
          break;
        }
        case 'Enter': {
          const allEntered = categories.every(c => (scoresRef.current[c.id] ?? 0) > 0);
          if (allEntered && tag !== 'BUTTON') {
            e.preventDefault();
            submitScores();
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [contestantData, focusedIndex]);

  const submitScores = async () => {
    setSaveState('saving');
    try {
      const res = await fetch(`/api/judge/contestant/${params.contestantId}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores }),
      });
      if (res.ok) {
        // Clear draft on successful submit
        if (contestantData) {
          localStorage.removeItem(draftKey(params.contestantId, contestantData.judgeId));
        }
        router.push('/judge');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save scores');
        setSaveState('error');
      }
    } catch {
      alert('Failed to save scores');
      setSaveState('error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitScores();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
          <p className="text-[var(--text-secondary)] text-sm">Loading contestant…</p>
        </div>
      </div>
    );
  }

  if (error || !contestantData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)] mb-4">{error || 'Contestant Not Found'}</p>
          <button onClick={() => router.push('/judge')} className="btn-primary px-6 py-3">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { contestant, categories } = contestantData;
  const allScoresEntered = categories.every(c => (scores[c.id] ?? 0) > 0);
  const completedCount = categories.filter(c => (scores[c.id] ?? 0) > 0).length;

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border)] shadow-[var(--shadow-sm)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/judge')}
                className="btn-secondary p-2"
                aria-label="Back"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-semibold text-[var(--text-primary)] text-base">Score Contestant</h1>
                <p className="text-xs text-[var(--text-muted)]">
                  {completedCount}/{categories.length} categories scored
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto-save indicator */}
              <AnimatePresence>
                {saveState === 'saving' && (
                  <motion.span
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-[var(--text-muted)] flex items-center gap-1"
                  >
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Saving…
                  </motion.span>
                )}
                {saveState === 'saved' && (
                  <motion.span
                    key="saved"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Draft saved
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Keyboard shortcuts hint */}
              <button
                onClick={() => setShowShortcuts(s => !s)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hidden sm:flex items-center gap-1 px-2 py-1 rounded border border-[var(--border)] transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Shortcuts
              </button>
            </div>
          </div>

          {/* Keyboard shortcuts panel */}
          <AnimatePresence>
            {showShortcuts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { keys: '← →', action: 'Switch category' },
                    { keys: '↑ ↓', action: 'Score ±0.5' },
                    { keys: 'Enter', action: 'Submit scores' },
                    { keys: 'Tab', action: 'Next category' },
                  ].map(({ keys, action }) => (
                    <div key={keys} className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-muted)] border border-[var(--border)] font-mono text-[var(--text-secondary)]">
                        {keys}
                      </kbd>
                      <span className="text-[var(--text-muted)]">{action}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          <div className="pb-1">
            <div className="w-full bg-[var(--bg-muted)] rounded-full h-1">
              <motion.div
                className="h-1 rounded-full bg-gradient-to-r from-violet-500 to-violet-600"
                animate={{ width: `${(completedCount / categories.length) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Contestant sidebar */}
          <div className="lg:col-span-1">
            <div className="card lg:sticky lg:top-6">
              {/* Mobile: horizontal layout — Desktop: centered column */}
              <div className="flex items-center gap-4 lg:flex-col lg:items-center lg:text-center">
                <div className="relative shrink-0">
                  {contestant.photo ? (
                    <img
                      src={contestant.photo}
                      alt={contestant.name}
                      className="w-20 h-28 lg:w-28 lg:h-36 rounded-xl object-cover ring-2 ring-violet-400"
                    />
                  ) : (
                    <div className="w-20 h-28 lg:w-28 lg:h-36 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/20 dark:to-violet-800/20 flex items-center justify-center ring-2 ring-violet-400">
                      <span className="text-4xl lg:text-5xl">👸</span>
                    </div>
                  )}
                  {allScoresEntered && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </div>
                <div className="flex-1 min-w-0 lg:mt-2">
                  <h2 className="font-display text-lg lg:text-xl font-bold text-[var(--text-primary)] truncate lg:text-center">{contestant.name}</h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5 truncate lg:text-center">{contestant.course}</p>
                  <p className="text-xs text-[var(--text-muted)] lg:text-center">{contestant.year} · Age {contestant.age}</p>
                  {/* Mobile progress mini-bar */}
                  <div className="mt-2 lg:hidden">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[var(--bg-muted)] rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full transition-all"
                          style={{ width: `${categories.length > 0 ? (categories.filter(c => (scores[c.id] ?? 0) > 0).length / categories.length) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs text-[var(--text-muted)] shrink-0">
                        {categories.filter(c => (scores[c.id] ?? 0) > 0).length}/{categories.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category quick-nav — horizontal scroll on mobile, vertical list on desktop */}
              <div className="mt-4">
                <div className="flex lg:flex-col overflow-x-auto gap-1 pb-1 lg:pb-0 lg:space-y-1 -mx-1 px-1 scrollbar-hide">
                  {categories.map((cat, i) => {
                    const scored = (scores[cat.id] ?? 0) > 0;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setFocusedIndex(i)}
                        className={`shrink-0 lg:shrink lg:w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-all duration-150 whitespace-nowrap lg:whitespace-normal ${
                          focusedIndex === i
                            ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 font-semibold'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
                        }`}
                      >
                        <span className="truncate max-w-[120px] lg:max-w-none">{cat.name}</span>
                        {scored ? (
                          <span className="score-number text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-2 shrink-0">
                            {scores[cat.id]}
                          </span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[var(--border)] shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Scoring form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {categories.map((category, i) => {
                  const score = scores[category.id] ?? 0;
                  const pct = category.maxScore > 0 ? (score / category.maxScore) * 100 : 0;
                  const isFocused = focusedIndex === i;

                  return (
                    <motion.div
                      key={category.id}
                      layout
                      onClick={() => setFocusedIndex(i)}
                      className={`card cursor-pointer transition-all duration-200 ${
                        isFocused
                          ? 'border-violet-400 dark:border-violet-500 shadow-[0_0_0_2px_rgba(139,92,246,0.15)]'
                          : 'hover:border-[var(--text-muted)]'
                      }`}
                    >
                      {/* Category header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            {isFocused && (
                              <motion.div
                                layoutId="focus-dot"
                                className="w-2 h-2 rounded-full bg-violet-500"
                              />
                            )}
                            <h4 className={`font-semibold ${isFocused ? 'text-violet-700 dark:text-violet-300' : 'text-[var(--text-primary)]'}`}>
                              {category.name}
                            </h4>
                          </div>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Weight: {(category.weight * 100).toFixed(0)}% · Max: {category.maxScore}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`score-number text-3xl font-bold transition-colors ${
                            score > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                          }`}>
                            {score > 0 ? score.toFixed(1) : '—'}
                          </div>
                          {score > 0 && (
                            <div className="text-xs text-[var(--text-muted)]">
                              {pct.toFixed(0)}%
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Slider */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-[var(--text-muted)] w-4">0</span>
                        <input
                          type="range"
                          min="0"
                          max={category.maxScore}
                          step="0.5"
                          value={score}
                          onChange={(e) => handleScoreChange(category.id, parseFloat(e.target.value))}
                          onFocus={() => setFocusedIndex(i)}
                          className="flex-1 accent-violet-500 cursor-pointer h-2"
                          aria-label={`${category.name} score`}
                        />
                        <span className="text-xs text-[var(--text-muted)] w-6 text-right">{category.maxScore}</span>
                        <input
                          type="number"
                          min="0"
                          max={category.maxScore}
                          step="0.5"
                          value={score || ''}
                          onChange={(e) => handleScoreChange(category.id, parseFloat(e.target.value) || 0)}
                          onFocus={() => setFocusedIndex(i)}
                          className="w-16 text-center text-sm px-2 py-1.5 rounded-lg border border-[var(--border)]
                            bg-[var(--bg-base)] text-[var(--text-primary)]
                            focus:outline-none focus:ring-2 focus:ring-violet-400 score-number"
                          placeholder="0"
                        />
                      </div>

                      {/* Progress fill */}
                      <div className="w-full bg-[var(--bg-muted)] rounded-full h-1">
                        <motion.div
                          className="h-1 rounded-full bg-gradient-to-r from-violet-400 to-violet-600"
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Submit */}
              <div className="mt-6 space-y-3">
                {!allScoresEntered && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                    Score all {categories.length} categories to submit
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/judge')}
                    className="btn-secondary py-3 px-5 flex-1 sm:flex-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveState === 'saving' || !allScoresEntered}
                    className={`flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm
                      ${allScoresEntered
                        ? 'bg-violet-600 hover:bg-violet-700 text-white active:scale-95'
                        : 'bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-not-allowed'
                      } disabled:opacity-60`}
                  >
                    {saveState === 'saving' ? 'Saving…' : 'Save Scores'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
