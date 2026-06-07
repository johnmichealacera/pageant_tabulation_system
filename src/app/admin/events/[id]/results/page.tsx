'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import RankingTable from '@/components/RankingTable';
import ThemeToggle from '@/components/ThemeToggle';

interface ReportData {
  event: { id: string; name: string; description: string; eventDate: string; isActive: boolean; };
  rankings: Array<{ contestantId: string; score: number; rank: number; number: number; contestant: any; }>;
  statistics: {
    totalContestants: number; totalJudges: number; totalCategories: number;
    totalPossibleScore: number; averageTotalScore: number;
    totalScoresSubmitted: number; totalPossibleSubmissions: number;
    completionPercentage: number; generatedAt: string;
  };
}

export default function EventResults({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading]       = useState(true);

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
    let csv = 'Rank,Candidate #,Name,Course,Score\n';
    reportData.rankings.forEach(r => {
      csv += `${r.rank},${r.number},"${r.contestant.name}","${r.contestant.course || ''}",${r.score}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${reportData.event.name.replace(/[^a-z0-9]/gi, '_')}_Results.csv`;
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
          <p className="text-[var(--text-secondary)] mb-4">Results not available</p>
          <button onClick={() => router.push(`/admin/events/${params.id}`)} className="btn-primary py-2 px-4 text-sm">
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  const { event, rankings, statistics } = reportData;

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">

      {/* Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border)] shadow-[var(--shadow-sm)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push(`/admin/events/${params.id}`)} className="btn-secondary p-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">Results</h1>
                <p className="text-xs text-[var(--text-muted)]">{event.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button onClick={exportCSV} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV
              </button>
              <button onClick={() => router.push(`/admin/events/${params.id}/report`)} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Full Report
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Stat pills */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Contestants',  value: statistics.totalContestants },
            { label: 'Judges',       value: statistics.totalJudges },
            { label: 'Completion',   value: `${statistics.completionPercentage}%` },
            { label: 'Avg Score',    value: statistics.averageTotalScore },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card text-center py-4">
              <div className="score-number text-2xl font-bold text-rose-500">{s.value}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Rankings */}
        <RankingTable rankings={rankings} />

        <p className="text-center text-xs text-[var(--text-muted)] pb-4">
          Generated {new Date(statistics.generatedAt).toLocaleString()}
        </p>

      </main>
    </div>
  );
}
