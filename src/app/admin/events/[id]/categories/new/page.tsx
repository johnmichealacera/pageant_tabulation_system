'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function NewCategory({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', maxScore: '25', weight: '0.25' });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'ADMIN') router.push('/auth/signin');
  }, [session, status]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${params.id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, maxScore: parseInt(formData.maxScore), weight: parseFloat(formData.weight) }),
      });
      if (res.ok) router.push(`/admin/events/${params.id}`);
      else { const err = await res.json(); alert(err.error || 'Failed to create category'); }
    } catch { alert('Failed to create category'); }
    finally { setLoading(false); }
  };

  const weightPct = (parseFloat(formData.weight) * 100).toFixed(0);
  const weightValid = parseFloat(formData.weight) > 0 && parseFloat(formData.weight) <= 1;

  if (status === 'loading') return null;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-start justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">

        <div className="mb-8">
          <button onClick={() => router.push(`/admin/events/${params.id}`)} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Event
          </button>
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Add Category</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Define a scoring category for this event</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Category Name *</label>
            <input type="text" required value={formData.name} onChange={set('name')} placeholder="e.g., Evening Gown, Q&A, Swimwear"
              className="form-input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Max Score *</label>
              <input type="number" required min="1" max="100" value={formData.maxScore} onChange={set('maxScore')}
                className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Weight * <span className={`ml-1 score-number text-sm font-bold ${weightValid ? 'text-emerald-500' : 'text-rose-500'}`}>{weightPct}%</span>
              </label>
              <input type="number" required min="0.01" max="1" step="0.01" value={formData.weight} onChange={set('weight')}
                className="form-input" />
            </div>
          </div>

          <div className="rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] px-4 py-3 text-xs text-[var(--text-muted)]">
            All category weights must add up to 1.0 (100%). A weight of 0.25 means this category contributes 25% to the total score.
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => router.push(`/admin/events/${params.id}`)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary py-2 px-5 text-sm disabled:opacity-50">
              {loading ? 'Adding…' : 'Add Category'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
