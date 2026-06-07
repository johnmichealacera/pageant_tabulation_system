'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

interface Ranking {
  contestantId: string;
  score: number;
  rank: number;
  number: number;
  contestant: { name: string; photo?: string; course?: string; };
}

interface EventData {
  event: { name: string; description: string; };
  rankings: Ranking[];
}

const MEDAL = ['👑', '🥈', '🥉'];
const RANK_COLOR = [
  'text-gold-400',
  'text-slate-300',
  'text-amber-500',
];
const BAR_COLOR = [
  'from-gold-500 to-gold-400',
  'from-slate-400 to-slate-300',
  'from-amber-600 to-amber-500',
];

function ScoreBar({ pct, rank, delay }: { pct: number; rank: number; delay: number }) {
  const color = BAR_COLOR[rank - 1] ?? 'from-zinc-500 to-zinc-400';
  return (
    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: 'easeOut', delay }}
      />
    </div>
  );
}

function LiveStageContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');

  const [data, setData]             = useState<EventData | null>(null);
  const [reveal, setReveal]         = useState(false);
  const [showControls, setControls] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = async () => {
    try {
      const url = eventId
        ? `/api/public/events/${eventId}`
        : '/api/public/active-event';
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        setData(d);
        const now = new Date();
        setLastUpdated(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`);
      }
    } catch {}
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Show/hide controls on mouse move, hide after 3s idle
  const controlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleMouseMove = () => {
    setControls(true);
    if (controlTimer.current) clearTimeout(controlTimer.current);
    controlTimer.current = setTimeout(() => setControls(false), 3000);
  };
  useEffect(() => () => { if (controlTimer.current) clearTimeout(controlTimer.current); }, []);

  const rankings = data?.rankings ?? [];
  const topScore = rankings[0]?.score ?? 1;
  const displayRankings = reveal ? rankings.slice(0, 1) : rankings.slice(0, 8);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0F1B35 0%, #111827 100%)' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-gold-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Waiting for active event…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white overflow-hidden flex flex-col select-none"
      onMouseMove={handleMouseMove}
      style={{
        fontFamily: 'var(--font-inter, Inter, sans-serif)',
        background: 'linear-gradient(135deg, #0F1B35 0%, #111827 60%, #0F172A 100%)',
      }}
    >
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -right-48 w-[700px] h-[700px] bg-indigo-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold-600/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-start justify-between gap-3 px-4 sm:px-8 lg:px-12 pt-5 sm:pt-10 pb-3 sm:pb-6">
        <div className="min-w-0 flex-1">
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-4xl xl:text-5xl font-bold tracking-tight leading-tight truncate"
            style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)' }}
          >
            {data.event.name}
          </motion.h1>
          {data.event.description && (
            <p className="text-white/60 text-xs sm:text-sm mt-0.5 sm:mt-1 tracking-wider uppercase truncate">{data.event.description}</p>
          )}
        </div>

        {/* Live indicator */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-xs sm:text-sm font-semibold tracking-widest uppercase">Live</span>
          </div>
          <p className="text-white/45 text-xs tabular-nums">{lastUpdated}</p>
        </div>
      </header>

      {/* Main leaderboard */}
      <main className="relative z-10 flex-1 px-4 sm:px-8 lg:px-12 pb-6 sm:pb-10 flex flex-col justify-center">

        <AnimatePresence mode="wait">
          {reveal ? (
            // ── Winner Reveal ──
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="flex flex-col items-center justify-center flex-1 text-center py-6 sm:py-12"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl sm:text-8xl mb-4 sm:mb-8"
              >
                👑
              </motion.div>

              {rankings[0]?.contestant.photo && (
                <motion.img
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  src={rankings[0].contestant.photo}
                  alt={rankings[0].contestant.name}
                  className="w-32 h-44 sm:w-48 sm:h-64 object-cover rounded-2xl sm:rounded-3xl border-4 border-gold-400 shadow-2xl shadow-gold-500/30 mb-5 sm:mb-8"
                />
              )}

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gold-400 text-sm sm:text-lg font-bold tracking-[0.3em] uppercase mb-2 sm:mb-3"
              >
                Winner
              </motion.p>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="text-3xl sm:text-6xl xl:text-8xl font-bold leading-tight px-2"
                style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)' }}
              >
                {rankings[0]?.contestant.name}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-white/40 text-base sm:text-xl mt-2 sm:mt-3"
              >
                {rankings[0]?.contestant.course}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-5 sm:mt-8 px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-gold-400/40 bg-gold-500/10"
              >
                <span
                  className="text-3xl sm:text-5xl font-bold text-gold-400"
                  style={{ fontFamily: 'var(--font-jetbrains, "JetBrains Mono", monospace)' }}
                >
                  {rankings[0]?.score}
                </span>
                <span className="text-white/40 text-base sm:text-xl ml-1.5 sm:ml-2">pts</span>
              </motion.div>
            </motion.div>

          ) : (
            // ── Leaderboard ──
            <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LayoutGroup>
                <div className="space-y-3">
                  {displayRankings.map((r, i) => {
                    const pct = topScore > 0 ? (r.score / topScore) * 100 : 0;
                    const isTop3 = r.rank <= 3;
                    return (
                      <motion.div
                        key={r.contestantId}
                        layout
                        layoutId={r.contestantId}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 30 }}
                        className={`flex items-center gap-2 sm:gap-5 px-3 sm:px-6 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl border transition-colors ${
                          isTop3
                            ? 'bg-white/10 border-white/20'
                            : 'bg-white/[0.05] border-white/10'
                        }`}
                      >
                        {/* Rank */}
                        <div className="w-8 sm:w-12 text-center shrink-0">
                          {isTop3 ? (
                            <span className="text-xl sm:text-3xl">{MEDAL[r.rank - 1]}</span>
                          ) : (
                            <span className="text-sm sm:text-xl font-bold text-white/50">{r.rank}</span>
                          )}
                        </div>

                        {/* Photo */}
                        <div className="shrink-0 hidden xs:block">
                          {r.contestant.photo ? (
                            <img src={r.contestant.photo} alt={r.contestant.name}
                              className={`object-cover rounded-lg sm:rounded-xl border ${
                                isTop3 ? 'border-white/20' : 'border-white/10'
                              }`}
                              style={{ width: isTop3 ? '3rem' : '2.5rem', height: isTop3 ? '4rem' : '3.5rem' }}
                            />
                          ) : (
                            <div className="rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center border border-white/15"
                              style={{ width: isTop3 ? '3rem' : '2.5rem', height: isTop3 ? '4rem' : '3.5rem' }}>
                              <span className="text-lg sm:text-2xl">👸</span>
                            </div>
                          )}
                        </div>

                        {/* Name + bar */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                            <span className={`font-bold truncate ${isTop3 ? 'text-sm sm:text-xl xl:text-2xl text-white' : 'text-xs sm:text-lg text-white/90'}`}
                              style={isTop3 ? { fontFamily: 'var(--font-playfair, "Playfair Display", serif)' } : {}}>
                              {r.contestant.name}
                            </span>
                            {r.contestant.course && (
                              <span className="text-white/30 text-xs truncate hidden xl:inline">{r.contestant.course}</span>
                            )}
                          </div>
                          <ScoreBar pct={pct} rank={r.rank} delay={i * 0.06 + 0.3} />
                        </div>

                        {/* Score */}
                        <div className="text-right shrink-0">
                          <span
                            className={`font-bold tabular-nums ${isTop3 ? 'text-lg sm:text-3xl xl:text-4xl' : 'text-base sm:text-2xl'} ${RANK_COLOR[r.rank - 1] ?? 'text-white/75'}`}
                            style={{ fontFamily: 'var(--font-jetbrains, "JetBrains Mono", monospace)' }}
                          >
                            {r.score}
                          </span>
                          <p className="text-white/45 text-xs mt-0.5">#{r.number}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </LayoutGroup>

              {rankings.length === 0 && (
                <div className="text-center py-12 sm:py-24 text-white/20">
                  <p className="text-lg sm:text-2xl font-light">Scoring in progress…</p>
                  <p className="text-sm mt-2">Rankings will appear as judges submit scores</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer ticker */}
      <div className="relative z-10 border-t border-white/10 px-4 sm:px-8 lg:px-12 py-2 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white/40 text-xs">
          <span className="tracking-widest uppercase">Live Tabulation</span>
          <span>·</span>
          <span>{rankings.length} contestant{rankings.length !== 1 ? 's' : ''}</span>
        </div>
        <p className="text-white/30 text-xs">Updates every 5 seconds</p>
      </div>

      {/* Floating controls (appear on mouse move) */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-2 sm:py-2.5">
              <button
                onClick={() => setReveal(false)}
                className={`px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  !reveal ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Leaderboard
              </button>
              <button
                onClick={() => setReveal(true)}
                className={`px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 ${
                  reveal ? 'bg-gold-500/20 text-gold-400' : 'text-white/40 hover:text-gold-400'
                }`}
              >
                <span>👑</span><span className="hidden xs:inline">Reveal</span> Winner
              </button>
              <div className="w-px h-4 bg-white/10" />
              <button
                onClick={() => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); }}
                className="text-white/40 hover:text-white transition-colors p-1.5 sm:px-2"
                title="Toggle fullscreen"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LiveStagePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0F1B35 0%, #111827 100%)' }}>
        <div className="w-12 h-12 rounded-full border-2 border-gold-500 border-t-transparent animate-spin" />
      </div>
    }>
      <LiveStageContent />
    </Suspense>
  );
}
