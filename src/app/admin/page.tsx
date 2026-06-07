'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

interface PageantEvent {
  id: string;
  name: string;
  description: string;
  eventDate: string;
  isActive: boolean;
  _count: {
    contestants: number;
    judges: number;
    categories: number;
    scores: number;
  };
}

function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="text-center">
      <div className={`score-number text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-[var(--text-muted)] mt-0.5">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents]   = useState<PageantEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    const role = (session?.user as any)?.role;
    if (!session || role !== 'ADMIN') { router.push('/auth/signin'); return; }
    fetchEvents();
  }, [session, status]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events');
      if (res.ok) setEvents(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  const handleSetActive = async (eventId: string) => {
    setActivating(eventId);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/activate`, { method: 'POST' });
      if (res.ok) fetchEvents();
    } catch {}
    finally { setActivating(null); }
  };

  const activeEvent  = events.find(e => e.isActive);
  const totalScores  = events.reduce((s, e) => s + (e._count.scores ?? 0), 0);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="w-10 h-10 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border)] shadow-[var(--shadow-sm)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Admin Dashboard</h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {session?.user?.name} · Pageant Management
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => router.push('/admin/events/new')}
                className="btn-primary py-2 px-4 text-sm hidden sm:block"
              >
                + New Event
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-400 transition-all duration-200"
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

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Events',      value: events.length,                                 color: 'text-[var(--text-primary)]' },
            { label: 'Active Event',       value: activeEvent ? '1' : '—',                       color: 'text-emerald-500' },
            { label: 'Total Scores',       value: totalScores,                                   color: 'text-gold-500' },
            { label: 'Contestants',        value: events.reduce((s, e) => s + e._count.contestants, 0), color: 'text-violet-500' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card text-center"
            >
              <div className={`score-number text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Events section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Pageant Events</h2>
            <button
              onClick={() => router.push('/admin/events/new')}
              className="btn-primary py-1.5 px-3 text-sm sm:hidden"
            >
              + New
            </button>
          </div>

          {events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card text-center py-16"
            >
              <div className="text-4xl mb-3">🎭</div>
              <p className="text-[var(--text-secondary)] font-medium">No events yet</p>
              <p className="text-sm text-[var(--text-muted)] mt-1 mb-6">Create your first pageant event to get started</p>
              <button onClick={() => router.push('/admin/events/new')} className="btn-primary py-2 px-6">
                Create First Event
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`card-hover relative overflow-hidden ${event.isActive ? 'border-emerald-400 dark:border-emerald-500' : ''}`}
                >
                  {/* Active glow */}
                  {event.isActive && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-gold-400 to-emerald-400" />
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">{event.name}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {new Date(event.eventDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    {event.isActive ? (
                      <span className="badge-active shrink-0">Active</span>
                    ) : (
                      <span className="badge bg-[var(--bg-muted)] text-[var(--text-muted)]">Inactive</span>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-xs text-[var(--text-secondary)] mb-4 line-clamp-2">{event.description}</p>
                  )}

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-y border-[var(--border-subtle)]">
                    <StatPill label="Contestants" value={event._count.contestants} color="text-[var(--text-primary)]" />
                    <StatPill label="Judges"      value={event._count.judges}      color="text-violet-500" />
                    <StatPill label="Categories"  value={event._count.categories}  color="text-gold-500" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/admin/events/${event.id}`)}
                      className="flex-1 btn-secondary py-2 text-sm"
                    >
                      Manage
                    </button>
                    {!event.isActive && (
                      <button
                        onClick={() => handleSetActive(event.id)}
                        disabled={activating === event.id}
                        className="flex-1 py-2 text-sm rounded-lg font-medium transition-all duration-200
                          bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400
                          border border-emerald-200 dark:border-emerald-800
                          hover:bg-emerald-100 dark:hover:bg-emerald-900/40
                          disabled:opacity-50"
                      >
                        {activating === event.id ? 'Activating…' : 'Set Active'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
