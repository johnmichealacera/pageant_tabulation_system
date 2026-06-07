'use client';

import { motion } from 'framer-motion';

interface Ranking {
  contestantId: string;
  score: number;
  contestant: any;
  rank: number;
  number: number;
}

interface RankingTableProps {
  rankings: Ranking[];
}

function rankLabel(rank: number): string {
  if (rank === 1) return 'WINNER';
  if (rank === 2) return '1ST RUNNER-UP';
  if (rank === 3) return '2ND RUNNER-UP';
  return `${rank - 1}TH RUNNER-UP`;
}

const RANK_STYLES = [
  // rank 1 — gold
  {
    card: 'border-gold-300 dark:border-gold-600 shadow-gold-200/40 dark:shadow-gold-900/30',
    badge: 'bg-gold-100 dark:bg-gold-900/40 text-gold-800 dark:text-gold-300 border-gold-300 dark:border-gold-600',
    score: 'text-gold-600 dark:text-gold-400',
    ring:  'ring-4 ring-gold-300 dark:ring-gold-600',
    crown: '👑',
  },
  // rank 2 — silver
  {
    card: 'border-slate-300 dark:border-slate-500',
    badge: 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-500',
    score: 'text-slate-600 dark:text-slate-300',
    ring:  'ring-4 ring-slate-300 dark:ring-slate-500',
    crown: '🥈',
  },
  // rank 3 — bronze
  {
    card: 'border-amber-300 dark:border-amber-700',
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    score: 'text-amber-600 dark:text-amber-400',
    ring:  'ring-4 ring-amber-300 dark:ring-amber-700',
    crown: '🥉',
  },
];

function rankStyles(rank: number) {
  return RANK_STYLES[rank - 1] ?? {
    card:  'border-[var(--border)]',
    badge: 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border)]',
    score: 'text-[var(--text-primary)]',
    ring:  '',
    crown: '',
  };
}

export default function RankingTable({ rankings }: RankingTableProps) {
  if (rankings.length === 0) {
    return (
      <div className="card text-center py-14">
        <p className="text-[var(--text-muted)]">No scores submitted yet</p>
      </div>
    );
  }

  const topScore = rankings[0]?.score ?? 1;

  const podium = rankings.slice(0, 3);
  const rest   = rankings.slice(3);

  return (
    <div className="space-y-6">

      {/* ── Podium ── */}
      <div className={`grid gap-4 ${podium.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : podium.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {podium.map((r, i) => {
          const styles = rankStyles(r.rank);
          const pct = topScore > 0 ? ((r.score / topScore) * 100).toFixed(1) : '0.0';
          return (
            <motion.div
              key={r.contestantId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 28 }}
              className={`card border-2 text-center ${styles.card} ${r.rank === 1 ? 'shadow-lg shadow-gold-200/30 dark:shadow-gold-900/20' : ''}`}
            >
              {/* Crown */}
              {styles.crown && (
                <div className="text-2xl mb-1">{styles.crown}</div>
              )}

              {/* Photo */}
              <div className="flex justify-center mb-3">
                {r.contestant.photo ? (
                  <img
                    src={r.contestant.photo}
                    alt={r.contestant.name}
                    className={`w-20 h-24 rounded-xl object-cover ${styles.ring}`}
                  />
                ) : (
                  <div className={`w-20 h-24 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center text-2xl ${styles.ring}`}>
                    👸
                  </div>
                )}
              </div>

              {/* Rank badge */}
              <div className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider mb-2 ${styles.badge}`}>
                {rankLabel(r.rank)}
              </div>

              <div className="text-xs font-semibold text-gold-500 mb-0.5">#{r.number}</div>
              <h3 className="font-display font-bold text-[var(--text-primary)] leading-snug mb-0.5">{r.contestant.name}</h3>
              {r.contestant.course && (
                <p className="text-xs text-[var(--text-muted)] mb-3">{r.contestant.course}</p>
              )}

              <div className={`score-number text-2xl font-bold ${styles.score}`}>{r.score}</div>
              <div className="text-xs text-[var(--text-muted)]">{pct}% of leader</div>

              {/* Progress bar */}
              <div className="w-full mt-3 bg-[var(--bg-muted)] rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.08 + 0.3 }}
                  className={`h-1.5 rounded-full ${r.rank === 1 ? 'bg-gold-500' : r.rank === 2 ? 'bg-slate-400' : 'bg-amber-500'}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Full Rankings Table ── */}
      <div className="card overflow-hidden">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4 text-sm">Complete Rankings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '520px' }}>
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
                const styles = rankStyles(r.rank);
                const pct = topScore > 0 ? ((r.score / topScore) * 100).toFixed(1) : '0.0';
                return (
                  <motion.tr
                    key={r.contestantId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-[var(--bg-muted)] transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${styles.badge}`}>
                        {rankLabel(r.rank)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.contestant.photo ? (
                        <img src={r.contestant.photo} alt={r.contestant.name}
                          className="w-10 h-14 rounded-lg object-cover border border-[var(--border)]" />
                      ) : (
                        <div className="w-10 h-14 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center text-base border border-[var(--border)]">
                          👸
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-bold text-gold-500">#{r.number}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-medium text-[var(--text-primary)]">{r.contestant.name}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--text-muted)] text-xs">
                      {r.contestant.course || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`score-number font-bold text-base ${styles.score}`}>{r.score}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2 min-w-[80px]">
                        <div className="w-16 bg-[var(--bg-muted)] rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${r.rank === 1 ? 'bg-gold-500' : r.rank === 2 ? 'bg-slate-400' : r.rank === 3 ? 'bg-amber-500' : 'bg-[var(--text-muted)]'}`}
                            style={{ width: `${pct}%` }}
                          />
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
    </div>
  );
}
