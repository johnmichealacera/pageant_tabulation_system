'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

interface Contestant {
  id: string; name: string; age: number; course: string; year: string; photo?: string;
  bio?: string; platform?: string; hometown?: string;
  achievements: Array<{ title: string; year?: string; description?: string }>;
  socialLinks: { instagram?: string; facebook?: string; twitter?: string };
  gallery: string[];
  pageantEvent: { id: string; name: string; isActive: boolean };
}

export default function ContestantProfile({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [contestant, setContestant] = useState<Contestant | null>(null);
  const [loading, setLoading]       = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/public/contestants/${params.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setContestant(d); })
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (!contestant) return;
      if (e.key === 'ArrowRight') setLightboxIdx(i => i !== null ? (i + 1) % contestant.gallery.length : null);
      if (e.key === 'ArrowLeft')  setLightboxIdx(i => i !== null ? (i - 1 + contestant.gallery.length) % contestant.gallery.length : null);
      if (e.key === 'Escape')     setLightboxIdx(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, contestant]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="w-10 h-10 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!contestant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">Contestant not found</p>
          <button onClick={() => router.back()} className="btn-primary py-2 px-4 text-sm">Go Back</button>
        </div>
      </div>
    );
  }

  const hasSocials = Object.values(contestant.socialLinks).some(Boolean);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">

      {/* Minimal nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[var(--bg-base)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-xs text-[var(--text-muted)]">{contestant.pageantEvent.name}</span>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero */}
      <div className="relative pt-14">
        <div className="h-64 sm:h-80 w-full overflow-hidden bg-gradient-to-br from-gold-900/40 via-obsidian-800 to-[var(--bg-base)]">
          {contestant.photo && (
            <img src={contestant.photo} alt={contestant.name}
              className="w-full h-full object-cover object-top opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/60 to-transparent" />
        </div>

        {/* Profile card overlaid on hero */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-start">

            {/* Photo */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="shrink-0">
              {contestant.photo ? (
                <img src={contestant.photo} alt={contestant.name}
                  className="w-32 h-40 sm:w-40 sm:h-52 rounded-2xl object-cover border-4 border-[var(--bg-surface)] shadow-2xl shadow-black/40" />
              ) : (
                <div className="w-32 h-40 sm:w-40 sm:h-52 rounded-2xl bg-[var(--bg-surface)] border-4 border-[var(--bg-surface)] flex items-center justify-center text-5xl shadow-2xl">
                  👸
                </div>
              )}
            </motion.div>

            {/* Name & details */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="pt-2 flex-1 min-w-0">
              <div className="badge-gold text-xs font-bold tracking-widest mb-2">
                {contestant.pageantEvent.name}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)] leading-tight mb-1">
                {contestant.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--text-muted)] mb-4">
                {contestant.age && <span>{contestant.age} yrs old</span>}
                {contestant.hometown && <><span>·</span><span>{contestant.hometown}</span></>}
                {contestant.course && <><span>·</span><span>{contestant.course}</span></>}
                {contestant.year   && <><span>·</span><span>{contestant.year}</span></>}
              </div>

              {/* Social links */}
              {hasSocials && (
                <div className="flex items-center gap-3">
                  {contestant.socialLinks.instagram && (
                    <a href={`https://instagram.com/${contestant.socialLinks.instagram.replace('@', '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[var(--text-muted)] hover:text-gold-500 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                  {contestant.socialLinks.facebook && (
                    <a href={`https://facebook.com/${contestant.socialLinks.facebook}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[var(--text-muted)] hover:text-gold-500 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content sections */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Platform */}
        {contestant.platform && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="card border-l-4 border-l-gold-400">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gold-500 font-bold text-xs tracking-widest uppercase">Platform & Advocacy</span>
              </div>
              <p className="text-[var(--text-primary)] text-lg font-display leading-relaxed italic">
                "{contestant.platform}"
              </p>
            </div>
          </motion.section>
        )}

        {/* Bio */}
        {contestant.bio && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-xs font-bold tracking-widest text-[var(--text-muted)] uppercase mb-3">About</h2>
            <div className="card">
              <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{contestant.bio}</p>
            </div>
          </motion.section>
        )}

        {/* Achievements */}
        {contestant.achievements.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h2 className="text-xs font-bold tracking-widest text-[var(--text-muted)] uppercase mb-3">Achievements</h2>
            <div className="space-y-3">
              {contestant.achievements.map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.05 }}
                  className="card flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-gold-600 dark:text-gold-400 text-sm">★</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[var(--text-primary)] text-sm">{a.title}</p>
                      {a.year && <span className="badge-gold text-xs">{a.year}</span>}
                    </div>
                    {a.description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{a.description}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Gallery */}
        {contestant.gallery.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-xs font-bold tracking-widest text-[var(--text-muted)] uppercase mb-3">Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {contestant.gallery.map((url, i) => (
                <motion.button key={i} onClick={() => setLightboxIdx(i)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="aspect-[3/4] rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
                  <img src={url} alt={`${contestant.name} gallery ${i + 1}`}
                    className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxIdx(null)}>
            <motion.img
              key={lightboxIdx}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              src={contestant.gallery[lightboxIdx]}
              alt=""
              className="max-w-full max-h-[90vh] rounded-xl object-contain"
              onClick={e => e.stopPropagation()}
            />
            <button onClick={() => setLightboxIdx(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              ✕
            </button>
            {contestant.gallery.length > 1 && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); setLightboxIdx(i => i !== null ? (i - 1 + contestant.gallery.length) % contestant.gallery.length : null); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  ‹
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setLightboxIdx(i => i !== null ? (i + 1) % contestant.gallery.length : null); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  ›
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
