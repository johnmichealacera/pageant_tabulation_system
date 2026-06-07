'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Particle canvas ─────────────────────────────────────────────────────────

interface Particle {
  x: number; y: number;
  size: number; speed: number;
  baseOpacity: number; opacity: number;
  twinkleSpeed: number; twinklePhase: number;
  drift: number; driftPhase: number;
  color: string;
}

function makeParticle(w: number, h: number, fromBottom = false): Particle {
  const colors = ['#F59E0B', '#FBD38D', '#FBBF24', '#FDE68A', 'rgba(255,255,255,0.7)'];
  return {
    x: Math.random() * w,
    y: fromBottom ? h + Math.random() * 40 : Math.random() * h,
    size: 1 + Math.random() * 2.5,
    speed: 0.25 + Math.random() * 0.6,
    baseOpacity: 0.2 + Math.random() * 0.6,
    opacity: 0,
    twinkleSpeed: 0.5 + Math.random() * 1.5,
    twinklePhase: Math.random() * Math.PI * 2,
    drift: (Math.random() - 0.5) * 0.3,
    driftPhase: Math.random() * Math.PI * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

function useParticleCanvas(canvasRef: React.RefObject<HTMLCanvasElement>, active: boolean) {
  const rafRef = useRef<number>(0);
  const particles = useRef<Particle[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    particles.current = Array.from({ length: 90 }, () =>
      makeParticle(canvas.width, canvas.height)
    );

    const draw = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach(p => {
        p.y -= p.speed;
        p.x += Math.sin(t * p.driftPhase * 0.5 + p.driftPhase) * p.drift;
        p.opacity = p.baseOpacity + Math.sin(t * p.twinkleSpeed + p.twinklePhase) * 0.25;

        if (p.y < -p.size * 2) {
          Object.assign(p, makeParticle(canvas.width, canvas.height, true));
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [active, canvasRef]);
}

// ─── Mini capability animations ──────────────────────────────────────────────

function LiveScoringDemo() {
  const [count, setCount] = useState(0);
  const target = 96.4;
  useEffect(() => {
    let start: number;
    const duration = 1400;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCount(parseFloat((p * target).toFixed(1)));
      if (p < 1) requestAnimationFrame(step);
    };
    const id = setTimeout(() => requestAnimationFrame(step), 100);
    return () => clearTimeout(id);
  }, []);

  const judges = ['J1', 'J2', 'J3', 'J4', 'J5'];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5 items-end">
        {judges.map((j, i) => (
          <motion.div key={j}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: i * 0.12, duration: 0.4, ease: 'easeOut' }}
            style={{ originY: 1 }}
            className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
              <span className="text-[8px] font-bold text-amber-300">{j}</span>
            </div>
            <motion.div
              className="w-6 rounded-sm bg-gradient-to-t from-amber-500 to-amber-300"
              initial={{ height: 0 }}
              animate={{ height: `${20 + Math.random() * 20}px` }}
              transition={{ delay: i * 0.12 + 0.2, duration: 0.5 }}
            />
          </motion.div>
        ))}
        <div className="ml-2 flex flex-col justify-end pb-1">
          <span className="font-mono text-2xl font-bold text-amber-400 leading-none tabular-nums">
            {count.toFixed(1)}
          </span>
          <span className="text-[9px] text-white/40 uppercase tracking-widest">avg score</span>
        </div>
      </div>
    </div>
  );
}

function AnalyticsDemo() {
  const bars = [
    { label: 'Gown', h: 75, anomaly: false },
    { label: 'Q&A', h: 90, anomaly: false },
    { label: 'Swim', h: 38, anomaly: true },
    { label: 'Talent', h: 82, anomaly: false },
  ];
  return (
    <div className="flex gap-2 items-end">
      {bars.map((b, i) => (
        <div key={b.label} className="flex flex-col items-center gap-1">
          <div className="relative w-7 rounded-sm overflow-hidden bg-white/5" style={{ height: 48 }}>
            <motion.div
              className={`absolute bottom-0 w-full rounded-sm ${b.anomaly ? 'bg-rose-400' : 'bg-gradient-to-t from-violet-500 to-violet-300'}`}
              initial={{ height: 0 }}
              animate={{ height: `${b.h}%` }}
              transition={{ delay: i * 0.15 + 0.1, duration: 0.6, ease: 'easeOut' }}
            />
            {b.anomaly && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.6], scale: 1 }}
                transition={{ delay: i * 0.15 + 0.8, duration: 0.4, repeat: Infinity, repeatType: 'reverse' }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-black"
              />
            )}
          </div>
          <span className="text-[8px] text-white/40">{b.label}</span>
        </div>
      ))}
      <motion.div
        initial={{ opacity: 0, x: 4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.0 }}
        className="ml-1 flex flex-col gap-1">
        <div className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 font-medium">
          ⚠ Anomaly
        </div>
        <div className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 border border-violet-500/40 text-violet-400 font-medium">
          Z = −2.1
        </div>
      </motion.div>
    </div>
  );
}

function StageDemo() {
  const finalists = [
    { name: 'Maria S.', score: '96.4' },
    { name: 'Ana R.', score: '94.1' },
    { name: 'Carmen G.', score: '92.8' },
  ];
  const medals = ['👑', '🥈', '🥉'];
  return (
    <div className="space-y-1.5 w-full">
      {finalists.map((f, i) => (
        <motion.div
          key={f.name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.2 + 0.1 }}
          className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
          <span className="text-sm">{medals[i]}</span>
          <span className="text-[10px] text-white/80 flex-1 font-medium">{f.name}</span>
          <span className="font-mono text-[10px] text-amber-400 font-bold">{f.score}</span>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ delay: 1.0, duration: 1.5, repeat: Infinity }}
        className="text-[8px] text-emerald-400 text-center tracking-widest uppercase">
        ● Live
      </motion.div>
    </div>
  );
}

// ─── Capability cards ─────────────────────────────────────────────────────────

const CAPABILITIES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: 'Live Real-Time Scoring',
    color: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-500/30',
    accent: 'text-amber-400',
    demo: <LiveScoringDemo />,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    title: 'Smart Judge Analytics',
    color: 'from-violet-500/20 to-violet-500/5',
    border: 'border-violet-500/30',
    accent: 'text-violet-400',
    demo: <AnalyticsDemo />,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Stage Presentation Mode',
    color: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/30',
    accent: 'text-emerald-400',
    demo: <StageDemo />,
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

interface IntroScreenProps {
  onComplete: () => void;
  originX: number;
  originY: number;
  expandFromOrigin: boolean;
}

export default function IntroScreen({ onComplete, originX, originY, expandFromOrigin }: IntroScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState(0);
  const [exiting, setExiting] = useState(false);

  useParticleCanvas(canvasRef, true);

  const complete = useCallback(() => {
    setExiting(true);
    setTimeout(onComplete, 480);
  }, [onComplete]);

  // Auto-advance
  useEffect(() => {
    const t = setTimeout(complete, 7500);
    return () => clearTimeout(t);
  }, [complete]);

  // Phase timers for choreography
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1100),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const titleLetters = 'PAGEANT TABULATION'.split('');

  return (
    <motion.div
      initial={expandFromOrigin ? { scale: 0, opacity: 0 } : { opacity: 0 }}
      animate={exiting ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
      transition={{
        duration: exiting ? 0.44 : (expandFromOrigin ? 0.55 : 0.4),
        ease: exiting ? [0.4, 0, 1, 1] : [0.16, 1, 0.3, 1],
      }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background: 'linear-gradient(160deg, #080810 0%, #0F0B1E 50%, #080810 100%)',
        transformOrigin: (exiting || expandFromOrigin) ? `${originX}px ${originY}px` : undefined,
      }}
    >
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(245,158,11,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, #080810 100%)' }}
      />

      {/* Skip button */}
      <button
        onClick={complete}
        className="absolute top-6 right-6 text-xs text-white/30 hover:text-white/70 transition-colors z-10 flex items-center gap-1.5 group"
      >
        Skip
        <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Centre stage */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl w-full">

        {/* Crown */}
        {phase >= 1 && (
          <motion.div
            initial={{ scale: 0, rotate: -25, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16, duration: 0.7 }}
            className="relative mb-6"
          >
            {/* Glow ring behind crown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.6, 0.3], scale: [0.5, 1.8, 1.4] }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, transparent 70%)', filter: 'blur(12px)' }}
            />
            <span className="text-8xl relative z-10 drop-shadow-2xl">👑</span>
          </motion.div>
        )}

        {/* Title — letter by letter */}
        <div className="overflow-hidden mb-1">
          <div className="flex flex-wrap justify-center">
            {titleLetters.map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 32 }}
                animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
                transition={{ delay: i * 0.038, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-3xl sm:text-5xl xl:text-6xl font-bold tracking-[0.1em] sm:tracking-[0.15em] text-white"
              >
                {char === ' ' ? ' ' : char}
              </motion.span>
            ))}
          </div>
        </div>

        {/* "SYSTEM" — offset timing */}
        <div className="overflow-hidden mb-2">
          {'SYSTEM'.split('').map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.75 + i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-2xl sm:text-4xl xl:text-5xl font-bold tracking-[0.2em] sm:tracking-[0.25em] inline-block"
              style={{ color: '#F59E0B' }}
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Sweep line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={phase >= 2 ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ delay: 0.9, duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          className="w-64 h-px mb-8"
          style={{ background: 'linear-gradient(90deg, transparent, #F59E0B 30%, #FBBF24 70%, transparent)', originX: 0 }}
        />

        {/* Capability cards */}
        {phase >= 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full mb-6 sm:mb-8">
            {CAPABILITIES.map((cap, i) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`rounded-2xl border p-4 text-left bg-gradient-to-b ${cap.color} ${cap.border} backdrop-blur-sm`}
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`${cap.accent}`}>{cap.icon}</div>
                  <h3 className="text-xs font-bold text-white/90 tracking-wide uppercase">{cap.title}</h3>
                </div>
                {/* Mini demo */}
                <div className="min-h-[72px] flex items-end">
                  {cap.demo}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tagline + CTA */}
        {phase >= 3 && (
          <>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="text-sm text-white/40 tracking-widest uppercase mb-6 font-light"
            >
              The professional platform for pageant excellence
            </motion.p>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, type: 'spring', stiffness: 200, damping: 18 }}
              onClick={complete}
              className="relative px-8 sm:px-10 py-3 sm:py-3.5 rounded-full font-bold text-sm tracking-wider text-white overflow-hidden group w-full max-w-xs sm:w-auto"
              style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
            >
              {/* Shimmer */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)', x: '-100%' }}
                animate={{ x: ['−100%', '200%'] }}
                transition={{ delay: 1.5, duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
              />
              <span className="relative z-10 flex items-center gap-2">
                Enter the Platform
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </motion.button>
          </>
        )}
      </div>

      {/* Bottom brand */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : {}}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-0 right-0 text-center"
      >
        <p className="text-[10px] text-white/20 tracking-[0.3em] uppercase">
          Professional State · Pageant Systems
        </p>
      </motion.div>
    </motion.div>
  );
}
