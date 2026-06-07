'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ImageUpload from '@/components/ImageUpload';

interface FormData {
  name: string; age: string; course: string; year: string; photo: string;
  bio: string; platform: string; hometown: string;
  instagram: string; facebook: string;
}

export default function NewContestant({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '', age: '', course: '', year: '', photo: '',
    bio: '', platform: '', hometown: '',
    instagram: '', facebook: '',
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'ADMIN') router.push('/auth/signin');
  }, [session, status]);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${params.id}/contestants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name, age: parseInt(formData.age), course: formData.course, year: formData.year,
          photo: formData.photo || null,
          bio: formData.bio || null,
          platform: formData.platform || null,
          hometown: formData.hometown || null,
          socialLinks: { instagram: formData.instagram || null, facebook: formData.facebook || null },
        }),
      });
      if (res.ok) router.push(`/admin/events/${params.id}`);
      else { const err = await res.json(); alert(err.error || 'Failed'); }
    } catch { alert('Failed to create contestant'); }
    finally { setLoading(false); }
  };

  if (status === 'loading') return null;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] py-10 px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">

        <div className="mb-8">
          <button onClick={() => router.push(`/admin/events/${params.id}`)} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Event
          </button>
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Add Contestant</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Fill in the contestant's profile details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Core info */}
          <div className="card space-y-4">
            <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Basic Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Full Name *</label>
                <input type="text" required value={formData.name} onChange={set('name')} placeholder="e.g., Maria Santos"
                  className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Age *</label>
                <input type="number" required min="16" max="30" value={formData.age} onChange={set('age')} placeholder="e.g., 20"
                  className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Hometown</label>
                <input type="text" value={formData.hometown} onChange={set('hometown')} placeholder="e.g., Cebu City"
                  className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Course *</label>
                <input type="text" required value={formData.course} onChange={set('course')} placeholder="e.g., BS Tourism"
                  className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Year Level *</label>
                <select required value={formData.year} onChange={set('year')} className="form-input">
                  <option value="">Select Year</option>
                  {['1st Year','2nd Year','3rd Year','4th Year','5th Year'].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div>
              <ImageUpload value={formData.photo} onChange={url => setFormData(prev => ({ ...prev, photo: url }))}
                label="Photo" showPreview />
            </div>
          </div>

          {/* Profile */}
          <div className="card space-y-4">
            <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Profile & Platform</h2>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Platform / Advocacy</label>
              <textarea rows={2} value={formData.platform} onChange={set('platform')}
                placeholder="What cause or advocacy does this contestant champion?"
                className="form-input resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Bio / About</label>
              <textarea rows={4} value={formData.bio} onChange={set('bio')}
                placeholder="Personal background, interests, goals..."
                className="form-input resize-none" />
            </div>
          </div>

          {/* Social */}
          <div className="card space-y-4">
            <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Social Links <span className="normal-case font-normal">(optional)</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Instagram username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">@</span>
                  <input type="text" value={formData.instagram} onChange={set('instagram')} placeholder="username"
                    className="form-input pl-7" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Facebook</label>
                <input type="text" value={formData.facebook} onChange={set('facebook')} placeholder="profile name or URL"
                  className="form-input" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.push(`/admin/events/${params.id}`)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary py-2 px-5 text-sm disabled:opacity-50">
              {loading ? 'Adding…' : 'Add Contestant'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
