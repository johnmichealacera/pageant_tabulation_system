'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function NewJudge({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: '', email: '', password: '', createAccount: true });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'ADMIN') router.push('/auth/signin');
  }, [session, status]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { type } = e.target;
    setFormData(prev => ({ ...prev, [field]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${params.id}/judges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) router.push(`/admin/events/${params.id}`);
      else { const err = await res.json(); alert(err.error || 'Failed to add judge'); }
    } catch { alert('Failed to add judge'); }
    finally { setLoading(false); }
  };

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
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Add Judge</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Add a judge to the scoring panel</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Judge Name *</label>
            <input type="text" required value={formData.name} onChange={set('name')} placeholder="e.g., Dr. Reyes"
              className="form-input" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Role / Title *</label>
            <input type="text" required value={formData.role} onChange={set('role')} placeholder="e.g., Head Judge, Faculty Representative"
              className="form-input" />
          </div>

          {/* Login account toggle */}
          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Create Login Account</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Judge will be able to sign in and submit scores</p>
            </div>
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, createAccount: !prev.createAccount }))}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${formData.createAccount ? 'bg-violet-500' : 'bg-[var(--border)]'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${formData.createAccount ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {formData.createAccount && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 overflow-hidden">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email *</label>
                <input type="email" required={formData.createAccount} value={formData.email} onChange={set('email')} placeholder="judge@school.edu"
                  className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Password *</label>
                <input type="password" required={formData.createAccount} value={formData.password} onChange={set('password')} placeholder="Min. 6 characters"
                  className="form-input" />
              </div>
            </motion.div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => router.push(`/admin/events/${params.id}`)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary py-2 px-5 text-sm disabled:opacity-50">
              {loading ? 'Adding…' : 'Add Judge'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
