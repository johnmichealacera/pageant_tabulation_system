'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnalyticsData {
  heatmap: Array<{
    contestantId: string; contestantName: string; contestantNumber: number;
    cells: Array<{ categoryId: string; categoryName: string; avgScore: number | null; maxScore: number; pct: number | null; judgeCount: number; }>;
  }>;
  categoryStats: Array<{
    categoryId: string; name: string; maxScore: number; weight: number;
    avgScore: number; avgPct: number; highestScore: number; lowestScore: number; stdDev: number; scoreCount: number;
  }>;
  judgeConsistency: Array<{
    judgeId: string; name: string; role: string;
    avgScore: number; stdDev: number; minScore: number; maxScore: number; scoreCount: number; bias: number;
  }>;
  anomalies: Array<{
    judgeId: string; judgeName: string; contestantId: string; contestantName: string;
    categoryId: string; categoryName: string; score: number; categoryAvg: number; zScore: number; type: 'high' | 'low';
  }>;
  overview: {
    totalContestants: number; totalJudges: number; totalCategories: number;
    topScore: number; avgScore: number; completionPct: number; anomalyCount: number;
  };
}

function heatColor(pct: number | null): string {
  if (pct === null) return 'bg-[var(--bg-muted)] text-[var(--text-muted)]';
  if (pct >= 85) return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300';
  if (pct >= 70) return 'bg-gold-100 dark:bg-gold-900/40 text-gold-800 dark:text-gold-300';
  if (pct >= 55) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300';
  return 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300';
}

export default function AnalyticsDashboard({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'heatmap' | 'categories' | 'judges' | 'anomalies'>('heatmap');

  useEffect(() => {
    if (status === 'loading') return;
    const role = (session?.user as any)?.role;
    if (!session || role !== 'ADMIN') { router.push('/auth/signin'); return; }
    fetch(`/api/admin/events/${params.id}/analytics`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [session, status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="w-10 h-10 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="text-center">
          <p className="text-[var(--text-secondary)]">Failed to load analytics</p>
          <button onClick={() => router.push(`/admin/events/${params.id}`)} className="btn-primary mt-4 py-2 px-4 text-sm">
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'heatmap',    label: 'Score Heatmap',       icon: '🔥' },
    { id: 'categories', label: 'Category Analysis',   icon: '📊' },
    { id: 'judges',     label: 'Judge Consistency',   icon: '⚖️' },
    { id: 'anomalies',  label: `Anomalies (${data.overview.anomalyCount})`, icon: '⚠️' },
  ] as const;

  const maxJudgeAvg = Math.max(...data.judgeConsistency.map(j => j.maxScore), 1);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">

      {/* Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border)] shadow-[var(--shadow-sm)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push(`/admin/events/${params.id}`)} className="btn-secondary p-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">Analytics</h1>
                <p className="text-xs text-[var(--text-muted)]">Score insights & anomaly detection</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section nav */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="flex space-x-1 min-w-max py-1">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`relative py-2 px-4 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-200 ${
                  activeSection === s.id
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                }`}>
                <span className="mr-1">{s.icon}</span>{s.label}
                {activeSection === s.id && (
                  <motion.div layoutId="analytics-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Overview stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Top Score',    value: data.overview.topScore,      color: 'text-gold-500' },
            { label: 'Avg Score',    value: data.overview.avgScore,      color: 'text-violet-500' },
            { label: 'Completion',   value: `${data.overview.completionPct}%`, color: 'text-emerald-500' },
            { label: 'Anomalies',    value: data.overview.anomalyCount,  color: data.overview.anomalyCount > 0 ? 'text-rose-500' : 'text-[var(--text-muted)]' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card text-center py-4">
              <div className={`score-number text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Score Heatmap ── */}
        {activeSection === 'heatmap' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-[var(--text-primary)]">Score Heatmap</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Average score per contestant per category</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-800" />≥85%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gold-200 dark:bg-gold-800" />70–84%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-800" />55–69%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-200 dark:bg-rose-800" />&lt;55%</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left pr-4 py-2 text-[var(--text-muted)] font-medium whitespace-nowrap sticky left-0 bg-[var(--bg-surface)]">Contestant</th>
                    {data.heatmap[0]?.cells.map(cell => (
                      <th key={cell.categoryId} className="px-2 py-2 text-center text-[var(--text-muted)] font-medium whitespace-nowrap max-w-20">
                        <div className="truncate max-w-[80px] mx-auto" title={cell.categoryName}>{cell.categoryName}</div>
                        <div className="text-[10px] font-normal">/{cell.maxScore}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.heatmap.map((row, i) => (
                    <motion.tr key={row.contestantId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                      <td className="pr-4 py-2 whitespace-nowrap sticky left-0 bg-[var(--bg-surface)]">
                        <div className="font-medium text-[var(--text-primary)]">{row.contestantName}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">#{row.contestantNumber}</div>
                      </td>
                      {row.cells.map(cell => (
                        <td key={cell.categoryId} className="px-2 py-2 text-center">
                          <div className={`rounded-lg px-2 py-1.5 font-mono font-semibold ${heatColor(cell.pct)}`}>
                            {cell.avgScore !== null ? cell.avgScore.toFixed(1) : '—'}
                          </div>
                          {cell.pct !== null && (
                            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{cell.pct}%</div>
                          )}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {data.heatmap.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)]">No scores to display yet</div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Category Analysis ── */}
        {activeSection === 'categories' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {data.categoryStats.map((cat, i) => (
              <motion.div key={cat.categoryId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">{cat.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">Weight: {(cat.weight * 100).toFixed(0)}% · Max: {cat.maxScore}</p>
                  </div>
                  <div className="text-right">
                    <div className={`score-number text-2xl font-bold ${cat.avgPct >= 80 ? 'text-emerald-500' : cat.avgPct >= 65 ? 'text-gold-500' : 'text-rose-500'}`}>
                      {cat.avgPct}%
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">avg performance</div>
                  </div>
                </div>
                {/* Bar */}
                <div className="w-full bg-[var(--bg-muted)] rounded-full h-2 mb-3">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${cat.avgPct}%` }} transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.06 }}
                    className={`h-2 rounded-full ${cat.avgPct >= 80 ? 'bg-emerald-500' : cat.avgPct >= 65 ? 'bg-gold-500' : 'bg-rose-500'}`} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center text-xs">
                  {[
                    { label: 'Avg Score',  value: cat.avgScore.toFixed(1), color: 'text-[var(--text-primary)]' },
                    { label: 'Highest',    value: cat.highestScore,         color: 'text-emerald-500' },
                    { label: 'Lowest',     value: cat.lowestScore,          color: 'text-rose-500' },
                    { label: 'Std Dev',    value: cat.stdDev.toFixed(2),   color: cat.stdDev > 3 ? 'text-amber-500' : 'text-[var(--text-muted)]' },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className={`score-number font-bold ${color}`}>{value}</div>
                      <div className="text-[var(--text-muted)]">{label}</div>
                    </div>
                  ))}
                </div>
                {cat.stdDev > 4 && (
                  <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    High variance — judges showed significant disagreement on this category
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Judge Consistency ── */}
        {activeSection === 'judges' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="card mb-2">
              <p className="text-xs text-[var(--text-muted)]">
                <strong className="text-[var(--text-primary)]">Bias</strong> shows each judge's average score relative to the panel average.
                Positive = more lenient, negative = stricter. A low standard deviation means consistent scoring.
              </p>
            </div>
            {data.judgeConsistency.map((j, i) => (
              <motion.div key={j.judgeId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[var(--text-primary)] text-sm">{j.name}</span>
                      <span className={`badge text-xs font-semibold ${j.bias > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : j.bias < -1 ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'}`}>
                        {j.bias > 0 ? '+' : ''}{j.bias} bias
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{j.role} · {j.scoreCount} scores submitted</p>
                  </div>
                </div>

                {/* Score range bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                    <span>Min: {j.minScore}</span>
                    <span>Avg: {j.avgScore}</span>
                    <span>Max: {j.maxScore}</span>
                  </div>
                  <div className="relative w-full h-3 bg-[var(--bg-muted)] rounded-full">
                    {/* Range bar */}
                    <div
                      className="absolute h-3 rounded-full bg-violet-200 dark:bg-violet-800"
                      style={{
                        left:  `${(j.minScore / maxJudgeAvg) * 100}%`,
                        width: `${((j.maxScore - j.minScore) / maxJudgeAvg) * 100}%`,
                      }}
                    />
                    {/* Avg dot */}
                    <div
                      className="absolute w-3 h-3 rounded-full bg-violet-600 border-2 border-white dark:border-obsidian-surface"
                      style={{ left: `calc(${(j.avgScore / maxJudgeAvg) * 100}% - 6px)` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  {[
                    { label: 'Avg Score', value: j.avgScore, color: 'text-[var(--text-primary)]' },
                    { label: 'Std Dev',   value: j.stdDev,   color: j.stdDev > 5 ? 'text-amber-500' : 'text-[var(--text-muted)]' },
                    { label: 'Range',     value: `${j.maxScore - j.minScore}`, color: 'text-[var(--text-muted)]' },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className={`score-number font-bold ${color}`}>{value}</div>
                      <div className="text-[var(--text-muted)]">{label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Anomalies ── */}
        {activeSection === 'anomalies' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {data.anomalies.length === 0 ? (
              <div className="card text-center py-14">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">No significant anomalies detected</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">All judge scores are within expected statistical range</p>
              </div>
            ) : (
              <>
                <div className="card bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>{data.anomalies.length} outlier score{data.anomalies.length > 1 ? 's' : ''}</strong> detected using Z-score analysis (threshold: ±1.75 standard deviations).
                    These scores may warrant a second look — they are not automatically excluded from the rankings.
                  </p>
                </div>
                {data.anomalies.map((a, i) => (
                  <motion.div key={`${a.judgeId}-${a.contestantId}-${a.categoryId}`}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="card border-l-4 border-l-amber-400"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`badge font-semibold text-xs ${a.type === 'high' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                            {a.type === 'high' ? '▲ Unusually High' : '▼ Unusually Low'}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">{a.judgeName}</span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)]">
                          Scored <strong>{a.contestantName}</strong> in <strong>{a.categoryName}</strong>
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          Category average: {a.categoryAvg} · This judge gave: {a.score}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="score-number text-2xl font-bold text-amber-600 dark:text-amber-400">{a.score}</div>
                        <div className="text-xs text-[var(--text-muted)]">Z = {a.zScore}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        )}

      </main>
    </div>
  );
}
