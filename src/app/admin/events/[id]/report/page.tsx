'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

interface ReportData {
  event: { id: string; name: string; description: string; eventDate: string; isActive: boolean; };
  contestants: Array<{ id: string; name: string; age: number; course: string; year: string; photo?: string; }>;
  judges: Array<{ id: string; name: string; role: string; user?: { email: string; }; }>;
  categories: Array<{ id: string; name: string; maxScore: number; weight: number; }>;
  rankings: Array<{ contestantId: string; score: number; rank: number; number: number; contestant: any; }>;
  detailedScores: Array<{
    contestant: any;
    categoryScores: Array<{
      categoryId: string; categoryName: string; maxScore: number; weight: number;
      judgeScores: Array<{ judgeId: string; judgeName: string; score: number | null; }>;
      averageScore: number; weightedScore: number;
    }>;
    totalScore: number;
  }>;
  statistics: {
    totalContestants: number; totalJudges: number; totalCategories: number;
    totalPossibleScore: number; averageTotalScore: number;
    totalScoresSubmitted: number; totalPossibleSubmissions: number;
    completionPercentage: number; generatedAt: string;
  };
}

function rankLabel(rank: number): string {
  if (rank === 1) return 'WINNER';
  if (rank === 2) return '1ST RU';
  if (rank === 3) return '2ND RU';
  return `${rank - 1}TH RU`;
}

export default function ComprehensiveReport({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [activeSection, setActiveSection] = useState<'rankings' | 'scores' | 'judges'>('rankings');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'ADMIN') { router.push('/auth/signin'); return; }
    fetch(`/api/admin/events/${params.id}/report`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setReportData(d); })
      .finally(() => setLoading(false));
  }, [session, status]);

  const exportCSV = () => {
    if (!reportData) return;
    const { event, rankings, statistics, detailedScores, judges } = reportData;
    let csv = `"${event.name} — Comprehensive Report"\n`;
    csv += `"Generated: ${new Date(statistics.generatedAt).toLocaleString()}"\n\n`;
    csv += '"FINAL RANKINGS"\n"Rank","Candidate #","Name","Course","Score"\n';
    rankings.forEach(r => {
      csv += `${r.rank},${r.number},"${r.contestant.name}","${r.contestant.course || ''}",${r.score}\n`;
    });
    csv += '\n"DETAILED SCORES"\n';
    detailedScores.forEach(c => {
      csv += `\n"Contestant: ${c.contestant.name}"\n`;
      csv += '"Category","Max","Weight",';
      judges.forEach(j => { csv += `"${j.name}",`; });
      csv += '"Avg","Weighted"\n';
      c.categoryScores.forEach(cat => {
        csv += `"${cat.categoryName}",${cat.maxScore},${(cat.weight * 100).toFixed(0)}%,`;
        cat.judgeScores.forEach(js => { csv += `${js.score !== null ? js.score : '-'},`; });
        csv += `${cat.averageScore},${cat.weightedScore}\n`;
      });
      csv += `"TOTAL",,,${c.totalScore}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${event.name.replace(/[^a-z0-9]/gi, '_')}_Report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="w-10 h-10 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">Report not available</p>
          <button onClick={() => router.push(`/admin/events/${params.id}`)} className="btn-primary py-2 px-4 text-sm">
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  const { event, rankings, statistics, detailedScores, judges } = reportData;
  const topScore = rankings[0]?.score ?? 1;

  const SECTIONS = [
    { id: 'rankings', label: 'Rankings' },
    { id: 'scores',   label: 'Detailed Scores' },
    { id: 'judges',   label: 'Judges Panel' },
  ] as const;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] print:bg-white" id="report-root">

      {/* Screen-only header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border)] shadow-[var(--shadow-sm)] print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push(`/admin/events/${params.id}`)} className="btn-secondary p-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">Full Report</h1>
                <p className="text-xs text-[var(--text-muted)]">{event.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button onClick={exportCSV} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
              <button onClick={() => window.print()} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Section tabs — screen only */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="flex space-x-1 min-w-max py-1">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`relative py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeSection === s.id
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                }`}>
                {s.label}
                {activeSection === s.id && (
                  <motion.div layoutId="report-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Print-only header */}
      <div className="hidden print:block px-6 pt-6 pb-4 border-b border-gray-300">
        <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
        <p className="text-sm text-gray-600">
          {new Date(event.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          {' '}· Report generated {new Date(statistics.generatedAt).toLocaleString()}
        </p>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:py-4 print:px-6 space-y-6">

        {/* Stat row — always shown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-2">
          {[
            { label: 'Contestants',  value: statistics.totalContestants },
            { label: 'Judges',       value: statistics.totalJudges },
            { label: 'Completion',   value: `${statistics.completionPercentage}%` },
            { label: 'Avg Score',    value: statistics.averageTotalScore },
          ].map((s, i) => (
            <div key={s.label} className="card text-center py-3 print:py-2 print:border print:border-gray-300 print:shadow-none">
              <div className="score-number text-xl font-bold text-rose-500 print:text-rose-700">{s.value}</div>
              <div className="text-xs text-[var(--text-muted)] print:text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Rankings (screen) ── */}
        {activeSection === 'rankings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="print:hidden space-y-4">
            <div className="card overflow-hidden">
              <h2 className="font-semibold text-[var(--text-primary)] mb-4 text-sm">Final Rankings</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3 text-left">Rank</th>
                      <th className="px-4 py-3 text-left">Photo</th>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Course</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3 text-center">vs Leader</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {rankings.map((r, i) => {
                      const pct = topScore > 0 ? ((r.score / topScore) * 100).toFixed(1) : '0.0';
                      const gold   = r.rank === 1;
                      const silver = r.rank === 2;
                      const bronze = r.rank === 3;
                      return (
                        <motion.tr key={r.contestantId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                          className="hover:bg-[var(--bg-muted)] transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${
                              gold   ? 'bg-gold-100 dark:bg-gold-900/40 text-gold-800 dark:text-gold-300 border-gold-300 dark:border-gold-600'
                              : silver ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-500'
                              : bronze ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                              : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border)]'
                            }`}>
                              {rankLabel(r.rank)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {r.contestant.photo
                              ? <img src={r.contestant.photo} alt={r.contestant.name} className="w-10 h-14 rounded-lg object-cover border border-[var(--border)]" />
                              : <div className="w-10 h-14 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center text-base border border-[var(--border)]">👸</div>
                            }
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs font-bold text-gold-500">#{r.number}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-[var(--text-primary)]">{r.contestant.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-[var(--text-muted)]">{r.contestant.course || '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`score-number font-bold text-base ${gold ? 'text-gold-500' : silver ? 'text-slate-400' : bronze ? 'text-amber-500' : 'text-[var(--text-primary)]'}`}>
                              {r.score}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2 min-w-[80px]">
                              <div className="w-16 bg-[var(--bg-muted)] rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${gold ? 'bg-gold-500' : silver ? 'bg-slate-400' : bronze ? 'bg-amber-500' : 'bg-[var(--text-muted)]'}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-[var(--text-muted)] tabular-nums">{pct}%</span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Detailed Scores (screen) ── */}
        {activeSection === 'scores' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="print:hidden space-y-6">
            {detailedScores.map((c, i) => {
              const ranking = rankings.find(r => r.contestantId === c.contestant.id);
              return (
                <motion.div key={c.contestant.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="card overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{c.contestant.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">{c.contestant.course || ''}{c.contestant.year ? ` · ${c.contestant.year}` : ''}</p>
                    </div>
                    <div className="text-right">
                      {ranking && ranking.rank <= 3 && (
                        <div className="text-xs font-bold text-gold-500 mb-0.5">{rankLabel(ranking.rank)}</div>
                      )}
                      <div className="score-number text-2xl font-bold text-rose-500">{c.totalScore}</div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="table-header">
                          <th className="px-3 py-2 text-left">Category</th>
                          <th className="px-3 py-2 text-center">Max</th>
                          <th className="px-3 py-2 text-center">Wt</th>
                          {judges.map(j => <th key={j.id} className="px-3 py-2 text-center whitespace-nowrap">{j.name.split(' ')[0]}</th>)}
                          <th className="px-3 py-2 text-center text-violet-600 dark:text-violet-400">Avg</th>
                          <th className="px-3 py-2 text-center text-rose-600 dark:text-rose-400">Wtd</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {c.categoryScores.map(cat => (
                          <tr key={cat.categoryId} className="hover:bg-[var(--bg-muted)] transition-colors">
                            <td className="px-3 py-2 font-medium text-[var(--text-primary)]">{cat.categoryName}</td>
                            <td className="px-3 py-2 text-center text-[var(--text-muted)]">{cat.maxScore}</td>
                            <td className="px-3 py-2 text-center text-[var(--text-muted)]">{(cat.weight * 100).toFixed(0)}%</td>
                            {cat.judgeScores.map(js => (
                              <td key={js.judgeId} className="px-3 py-2 text-center text-[var(--text-primary)] font-mono">
                                {js.score !== null ? js.score : <span className="text-[var(--text-muted)]">—</span>}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-center font-semibold text-violet-600 dark:text-violet-400 font-mono">{cat.averageScore}</td>
                            <td className="px-3 py-2 text-center font-bold text-rose-600 dark:text-rose-400 font-mono">{cat.weightedScore}</td>
                          </tr>
                        ))}
                        <tr className="bg-[var(--bg-muted)]">
                          <td colSpan={3 + judges.length} className="px-3 py-2 text-right font-semibold text-[var(--text-secondary)] text-xs">Total Score</td>
                          <td colSpan={2} className="px-3 py-2 text-center score-number font-bold text-lg text-rose-500">{c.totalScore}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ── Judges Panel (screen) ── */}
        {activeSection === 'judges' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="print:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {judges.map((j, i) => (
                <motion.div key={j.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="card flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{i + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] text-sm">{j.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{j.role}</p>
                    {j.user?.email && <p className="text-xs text-[var(--text-muted)] mt-0.5">{j.user.email}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Print-only full content ── */}
        <div className="hidden print:block space-y-8">

          {/* Rankings table */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">Final Rankings</h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">Rank</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">#</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Name</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Course</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Score</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map(r => (
                  <tr key={r.contestantId} className={r.rank <= 3 ? 'bg-yellow-50' : ''}>
                    <td className="border border-gray-300 px-2 py-1 font-bold text-gray-800">{rankLabel(r.rank)}</td>
                    <td className="border border-gray-300 px-2 py-1 font-semibold">#{r.number}</td>
                    <td className="border border-gray-300 px-2 py-1 font-medium">{r.contestant.name}</td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-600">{r.contestant.course || '—'}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center font-bold">{r.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed scores */}
          {detailedScores.map(c => (
            <div key={c.contestant.id} className="break-inside-avoid">
              <h3 className="text-base font-bold text-gray-900 mb-2 border-b border-gray-200 pb-1">
                {c.contestant.name} {c.contestant.course ? `— ${c.contestant.course}` : ''}
              </h3>
              <table className="w-full text-xs border-collapse mb-1">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-1 text-left">Category</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Max</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Wt</th>
                    {judges.map(j => <th key={j.id} className="border border-gray-300 px-2 py-1 text-center">{j.name.split(' ')[0]}</th>)}
                    <th className="border border-gray-300 px-2 py-1 text-center">Avg</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Wtd</th>
                  </tr>
                </thead>
                <tbody>
                  {c.categoryScores.map(cat => (
                    <tr key={cat.categoryId}>
                      <td className="border border-gray-300 px-2 py-1">{cat.categoryName}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{cat.maxScore}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{(cat.weight * 100).toFixed(0)}%</td>
                      {cat.judgeScores.map(js => (
                        <td key={js.judgeId} className="border border-gray-300 px-2 py-1 text-center">
                          {js.score !== null ? js.score : '—'}
                        </td>
                      ))}
                      <td className="border border-gray-300 px-2 py-1 text-center font-semibold">{cat.averageScore}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center font-bold">{cat.weightedScore}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={3 + judges.length} className="border border-gray-300 px-2 py-1 text-right">Total Score</td>
                    <td colSpan={2} className="border border-gray-300 px-2 py-1 text-center text-base">{c.totalScore}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}

          {/* Judges */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">Judges Panel</h2>
            <div className="grid grid-cols-3 gap-3">
              {judges.map((j, i) => (
                <div key={j.id} className="border border-gray-300 rounded p-2">
                  <p className="font-bold text-gray-900 text-xs">Judge {i + 1}: {j.name}</p>
                  <p className="text-gray-600 text-[10px]">{j.role}</p>
                  {j.user?.email && <p className="text-gray-500 text-[10px]">{j.user.email}</p>}
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-400 pt-4 border-t border-gray-200">
            Official report — {event.name} · Generated {new Date(statistics.generatedAt).toLocaleString()}
          </p>
        </div>

      </main>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .hidden.print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}
