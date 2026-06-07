'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import ContestantCard from '@/components/ContestantCard';
import RankingTable from '@/components/RankingTable';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import ThemeToggle from '@/components/ThemeToggle';
import IntroScreen from '@/components/IntroScreen';

interface EventData {
  event: {
    id: string;
    name: string;
    description: string;
    eventDate: string;
    contestants: Array<{
      id: string;
      name: string;
      age: number;
      course: string;
      year: string;
      photo?: string;
    }>;
    judges: Array<{
      id: string;
      name: string;
      role: string;
    }>;
    categories: Array<{
      id: string;
      name: string;
      maxScore: number;
      weight: number;
    }>;
    scores: Array<{
      id: string;
      score: number;
      contestantId: string;
      categoryId: string;
      judgeId: string;
    }>;
  };
  rankings: Array<{
    contestantId: string;
    score: number;
    rank: number;
    number: number;
    contestant: any;
  }>;
  totalScores: { [key: string]: number };
}

interface EventOption {
  id: string;
  name: string;
  description: string;
  eventDate: string;
  isActive: boolean;
}

const POLL_INTERVAL = 5000;

export default function Home() {
  const router = useRouter();

  // Intro screen state
  const [showIntro, setShowIntro] = useState(true);
  const [expandFromButton, setExpandFromButton] = useState(false);
  const [introOrigin, setIntroOrigin] = useState({ x: 0, y: 0 });
  const introButtonRef = useRef<HTMLButtonElement>(null);
  const buttonControls = useAnimation();

  const [activeTab, setActiveTab] = useState<'contestants' | 'scoring' | 'rankings' | 'breakdown'>('contestants');
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [allEvents, setAllEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContestantId, setSelectedContestantId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const eventIdRef = useRef<string | null>(null);

  // Initial load
  useEffect(() => {
    fetchAllEvents();
    fetchActiveEvent();
  }, []);

  // Keep eventIdRef in sync
  useEffect(() => {
    eventIdRef.current = eventData?.event?.id ?? null;
  }, [eventData?.event?.id]);

  // After loading, measure button position for the suck-out exit animation
  useEffect(() => {
    if (!loading && introButtonRef.current) {
      const r = introButtonRef.current.getBoundingClientRect();
      setIntroOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
  }, [loading]);

  const getButtonCenter = () => {
    if (introButtonRef.current) {
      const r = introButtonRef.current.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    return introOrigin;
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    setTimeout(() => {
      buttonControls.start({ scale: [1, 1.5, 1.1, 1], transition: { duration: 0.5, ease: 'easeOut' } });
    }, 60);
  };

  const openIntroFromButton = () => {
    const origin = getButtonCenter();
    setIntroOrigin(origin);
    setExpandFromButton(true);
    setShowIntro(true);
  };

  // Auto-poll every 5 seconds
  useEffect(() => {
    const poll = setInterval(() => {
      const id = eventIdRef.current;
      if (id) {
        fetchEventById(id, false);
      } else {
        fetchActiveEvent(false);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(poll);
  }, []);

  // Also refresh on tab focus
  useEffect(() => {
    const onFocus = () => {
      const id = eventIdRef.current;
      if (id) fetchEventById(id, false);
      else fetchActiveEvent(false);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const fetchAllEvents = async () => {
    try {
      const res = await fetch(`/api/public/events?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) setAllEvents(await res.json());
    } catch {}
  };

  const fetchActiveEvent = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch(`/api/public/active-event?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        setEventData(await res.json());
        setLastUpdated(new Date());
        setError(null);
      } else if (res.status === 404) {
        setError('No active pageant event found');
      } else {
        setError('Failed to load event data');
      }
    } catch {
      setError('Failed to load event data');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchEventById = async (eventId: string, showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch(`/api/public/events/${eventId}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        setEventData(await res.json());
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('Failed to load event data');
      }
    } catch {
      setError('Failed to load event data');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    const id = eventIdRef.current;
    const fn = id ? fetchEventById(id) : fetchActiveEvent();
    fn.finally(() => setRefreshing(false));
  };

  const handleEventChange = (eventId: string) => fetchEventById(eventId);

  const [showQR, setShowQR] = useState(false);
  const publicUrl = typeof window !== 'undefined' ? window.location.href : '';

  const tabs = [
    { id: 'contestants', label: 'Contestants', icon: '👑' },
    { id: 'scoring',     label: 'Scoring',     icon: '📊' },
    { id: 'rankings',    label: 'Rankings',    icon: '🏆' },
    { id: 'breakdown',   label: 'Breakdown',   icon: '📈' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-3"
        >
          <div className="w-12 h-12 mx-auto rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
          <p className="text-[var(--text-secondary)] text-sm font-medium">Loading event data…</p>
        </motion.div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md px-6"
        >
          <div className="text-4xl mb-4">👑</div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            {error || 'No Event Available'}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mb-6">
            {error === 'No active pageant event found'
              ? 'There is currently no active pageant event. Check back later or contact the administrator.'
              : 'Unable to load the pageant event data at this time.'}
          </p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="btn-primary px-6 py-3"
          >
            Admin / Judge Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
    <AnimatePresence>
      {showIntro && (
        <IntroScreen
          key="intro"
          onComplete={handleIntroComplete}
          originX={introOrigin.x}
          originY={introOrigin.y}
          expandFromOrigin={expandFromButton}
        />
      )}
    </AnimatePresence>
    <div className="min-h-screen bg-[var(--bg-base)] pb-16 sm:pb-0">

      {/* Event selector bar */}
      {allEvents.length > 1 && (
        <div className="border-b border-[var(--border)] bg-[var(--bg-surface)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                  View Event
                </span>
                <select
                  onChange={(e) => handleEventChange(e.target.value)}
                  value={eventData?.event.id || ''}
                  className="text-sm px-3 py-1 rounded-lg border border-[var(--border)]
                    bg-[var(--bg-base)] text-[var(--text-primary)]
                    focus:outline-none focus:ring-2 focus:ring-gold-400"
                >
                  {allEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}{event.isActive ? ' (Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {allEvents.length} events available
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border)] shadow-[var(--shadow-sm)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center py-4 md:py-5 gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text-primary)] truncate">
                {eventData.event.name}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                {eventData.event.description} · {new Date(eventData.event.eventDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Live indicator */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Live</span>
              </div>

              {/* Contestant count */}
              <div className="text-right hidden sm:block">
                <p className="text-xs text-[var(--text-muted)]">Contestants</p>
                <p className="score-number text-xl font-bold text-gold-500">
                  {eventData.event.contestants.length}
                </p>
              </div>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]
                  text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                  transition-all duration-200 disabled:opacity-50"
                title="Refresh data"
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* QR Code */}
              <button
                onClick={() => setShowQR(true)}
                className="hidden sm:flex p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]
                  text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                  transition-all duration-200 items-center"
                title="Show QR code for audience"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </button>

              {/* Intro replay — desktop only; mobile uses the bottom bar */}
              <motion.button
                ref={introButtonRef}
                animate={buttonControls}
                onClick={openIntroFromButton}
                className={`hidden sm:flex p-2 rounded-lg border transition-all duration-300 items-center ${
                  showIntro
                    ? 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                    : 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                }`}
                style={{ opacity: showIntro ? 0.4 : 1, pointerEvents: showIntro ? 'none' : 'auto' }}
                title="Watch intro presentation"
              >
                {/* Play-circle icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
                </svg>
              </motion.button>

              {/* Stage View */}
              <button
                onClick={() => window.open(`/live?eventId=${eventData.event.id}`, '_blank')}
                className="relative flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-sm font-semibold
                  bg-gradient-to-r from-gold-500 to-amber-400 text-white shadow-md
                  hover:from-gold-400 hover:to-amber-300 transition-all duration-200 whitespace-nowrap
                  ring-2 ring-gold-400/30 hover:ring-gold-400/60"
                title="Open stage presentation view"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Stage View</span>
                <span className="sm:hidden">Stage</span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
              </button>

              {/* Dark mode toggle */}
              <ThemeToggle />

              {/* Login */}
              <button
                onClick={() => router.push('/auth/signin')}
                className="btn-primary py-2 px-4 text-sm whitespace-nowrap hidden sm:block"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Auto-update notice */}
      {lastUpdated && (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 text-center">
              Scores update automatically every 5 seconds · Last updated{' '}
              {lastUpdated.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="bg-[var(--bg-surface)] border-b border-[var(--border)] overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 min-w-max py-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative py-3 px-4 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-gold-600 dark:text-gold-400 bg-gold-50 dark:bg-gold-900/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">

          {activeTab === 'contestants' && (
            <motion.div
              key="contestants"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Contestants</h2>
                <span className="badge-gold">
                  {eventData.event.contestants.length} Total
                </span>
              </div>
              {eventData.event.contestants.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">👸</div>
                  <p className="text-[var(--text-secondary)]">No contestants added yet</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Check back later</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {eventData.event.contestants
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((contestant, index) => (
                      <ContestantCard
                        key={contestant.id}
                        contestant={contestant}
                        candidateNumber={index + 1}
                        index={index}
                        onClick={() => {
                          setSelectedContestantId(contestant.id);
                          setActiveTab('breakdown');
                        }}
                      />
                    ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'scoring' && (
            <motion.div
              key="scoring"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-6">Scoring System</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                    Categories
                  </h3>
                  {eventData.event.categories.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-muted)]">No categories defined yet</div>
                  ) : (
                    <div className="space-y-3">
                      {eventData.event.categories.map((category, i) => (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="card flex justify-between items-center"
                        >
                          <div>
                            <h4 className="font-medium text-[var(--text-primary)]">{category.name}</h4>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              Weight: {(category.weight * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="score-number text-lg font-bold text-gold-500">{category.maxScore}</p>
                            <p className="text-xs text-[var(--text-muted)]">Max</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                    Judges Panel
                  </h3>
                  {eventData.event.judges.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-muted)]">No judges assigned yet</div>
                  ) : (
                    <div className="space-y-3">
                      {eventData.event.judges.map((judge, i) => (
                        <motion.div
                          key={judge.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="card"
                        >
                          <h4 className="font-medium text-[var(--text-primary)]">{judge.name}</h4>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{judge.role}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'rankings' && (
            <motion.div
              key="rankings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-6">Rankings</h2>
              {eventData.rankings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">🏆</div>
                  <p className="text-[var(--text-secondary)]">No scores available yet</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Rankings will appear once judges start scoring</p>
                </div>
              ) : (
                <RankingTable rankings={eventData.rankings} />
              )}
            </motion.div>
          )}

          {activeTab === 'breakdown' && (
            <motion.div
              key="breakdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {selectedContestantId ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setSelectedContestantId(null); setActiveTab('contestants'); }}
                        className="flex items-center gap-1 text-sm text-gold-600 dark:text-gold-400 hover:underline font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Contestants
                      </button>
                      <span className="text-[var(--text-muted)]">/</span>
                      <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                        {eventData.event.contestants.find(c => c.id === selectedContestantId)?.name}
                      </h2>
                    </div>
                  </div>

                  {(() => {
                    const contestant = eventData.event.contestants.find(c => c.id === selectedContestantId);
                    if (!contestant || !eventData.event.scores.length) {
                      return (
                        <div className="text-center py-12">
                          <p className="text-[var(--text-muted)]">No scores available yet</p>
                        </div>
                      );
                    }

                    const categoryScores = eventData.event.categories.map(category => {
                      const catScores = eventData.event.scores.filter(
                        s => s.contestantId === selectedContestantId && s.categoryId === category.id
                      );
                      const avgScore = catScores.length > 0
                        ? catScores.reduce((sum, s) => sum + s.score, 0) / catScores.length
                        : 0;
                      return { category, avgScore, weightedScore: avgScore * category.weight, count: catScores.length };
                    });

                    return (
                      <div className="space-y-6">
                        <div className="card flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                          {contestant.photo ? (
                            <img src={contestant.photo} alt={contestant.name}
                              className="w-24 h-32 rounded-xl object-cover ring-1 ring-[var(--border)]" />
                          ) : (
                            <div className="w-24 h-32 rounded-xl bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/20 dark:to-gold-800/20 flex items-center justify-center">
                              <span className="text-4xl">👸</span>
                            </div>
                          )}
                          <div className="text-center sm:text-left">
                            <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">{contestant.name}</h3>
                            <p className="text-[var(--text-secondary)] text-sm mt-1">{contestant.course}</p>
                            <p className="text-[var(--text-muted)] text-sm">{contestant.year} · Age {contestant.age}</p>
                            <div className="mt-3">
                              <span className="score-number text-2xl font-bold text-gold-500">
                                {eventData.totalScores[selectedContestantId]?.toFixed(2) || '0.00'}
                              </span>
                              <span className="text-xs text-[var(--text-muted)] ml-1">total score</span>
                            </div>
                          </div>
                        </div>

                        <div className="card">
                          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Category Performance</h3>
                          <div className="space-y-4">
                            {categoryScores.map(({ category, avgScore, weightedScore, count }, i) => (
                              <motion.div
                                key={category.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="border border-[var(--border)] rounded-lg p-4"
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-medium text-[var(--text-primary)] text-sm">{category.name}</h4>
                                  <span className="text-xs text-[var(--text-muted)]">
                                    Weight: {(category.weight * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                  {[
                                    { label: 'Avg Score', value: avgScore.toFixed(1), color: 'text-gold-500' },
                                    { label: 'Weighted', value: weightedScore.toFixed(1), color: 'text-violet-500' },
                                    { label: 'Judges', value: String(count), color: 'text-[var(--text-primary)]' },
                                  ].map(({ label, value, color }) => (
                                    <div key={label}>
                                      <div className={`score-number text-xl font-bold ${color}`}>{value}</div>
                                      <div className="text-xs text-[var(--text-muted)]">{label}</div>
                                    </div>
                                  ))}
                                </div>
                                <div className="w-full bg-[var(--bg-muted)] rounded-full h-1.5">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(avgScore / category.maxScore) * 100}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
                                    className="h-1.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
                                  />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-6">Category Breakdown</h2>
                  {eventData.rankings.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-4xl mb-3">📈</div>
                      <p className="text-[var(--text-secondary)]">No scores available yet</p>
                    </div>
                  ) : (
                    <CategoryBreakdown
                      contestants={eventData.event.contestants}
                      categories={eventData.event.categories}
                      totalScores={eventData.totalScores}
                    />
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* QR Code modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-surface)] rounded-2xl p-6 shadow-2xl border border-[var(--border)] w-full max-w-xs text-center"
            >
              <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">Scan to Join</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">Share this QR with your audience</p>
              <div className="w-44 h-44 mx-auto rounded-xl overflow-hidden border border-[var(--border)] bg-white p-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(publicUrl)}&margin=0`}
                  alt="QR Code"
                  className="w-full h-full"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-3 break-all px-2">{publicUrl}</p>
              <button
                onClick={() => setShowQR(false)}
                className="mt-4 btn-secondary py-2 px-5 text-sm"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom navigation — sm:hidden */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)] border-t border-[var(--border)] shadow-lg">
        <div className="flex items-center justify-around py-1">
          {/* Login */}
          <button
            onClick={() => router.push('/auth/signin')}
            className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors min-w-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-medium">Login</span>
          </button>
          {/* Stage View */}
          <button
            onClick={() => window.open(`/live?eventId=${eventData.event.id}`, '_blank')}
            className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors min-w-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] font-medium">Stage</span>
          </button>
          {/* Intro */}
          <button
            onClick={openIntroFromButton}
            style={{ opacity: showIntro ? 0.4 : 1, pointerEvents: showIntro ? 'none' : 'auto' }}
            className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg text-[var(--text-muted)] hover:text-amber-600 dark:hover:text-amber-400 transition-colors min-w-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
            </svg>
            <span className="text-[10px] font-medium">Intro</span>
          </button>
          {/* QR Code */}
          <button
            onClick={() => setShowQR(true)}
            className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors min-w-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span className="text-[10px] font-medium">QR Code</span>
          </button>
        </div>
      </nav>
    </div>
    </>
  );
}
