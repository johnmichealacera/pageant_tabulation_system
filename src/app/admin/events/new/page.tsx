'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function NewEvent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', eventDate: '' });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'ADMIN') router.push('/auth/signin');
  }, [session, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const event = await res.json();
        router.push(`/admin/events/${event.id}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create event');
      }
    } catch { alert('Failed to create event'); }
    finally { setLoading(false); }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  if (status === 'loading') return null;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-start justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">

        <div className="mb-8">
          <button onClick={() => router.push('/admin')} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Create Event</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Set up a new pageant scoring event</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Event Name *</label>
            <input type="text" required value={formData.name} onChange={set('name')}
              placeholder="e.g., Miss Campus 2025"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]
                text-[var(--text-primary)] placeholder-[var(--text-muted)]
                focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
            <textarea rows={3} value={formData.description} onChange={set('description')}
              placeholder="Brief description of the event..."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]
                text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none
                focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Event Date *</label>
            <input type="date" required value={formData.eventDate} onChange={set('eventDate')}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]
                text-[var(--text-primary)]
                focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => router.push('/admin')} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary py-2 px-5 text-sm disabled:opacity-50">
              {loading ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
