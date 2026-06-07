'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignIn() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        const session = await getSession();
        const role = (session?.user as any)?.role;
        router.push(role === 'ADMIN' ? '/admin' : '/judge');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0A0A0F 0%, #1A0A2E 40%, #0F0A1E 70%, #0A0A0F 100%)',
      }}
    >
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 60%)', filter: 'blur(80px)' }} />
      </div>

      {/* Crown pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 12L48 28L64 30L52 42L55 58L40 50L25 58L28 42L16 30L32 28Z' fill='%23F59E0B'/%3E%3C/svg%3E")`,
          backgroundSize: '160px 160px',
        }}
      />

      {/* Pageant winner image */}
      <div className="absolute right-0 top-0 bottom-0 w-2/5 pointer-events-none hidden lg:flex items-end justify-end overflow-hidden">
        <img
          src="/pageant-winner.png"
          alt=""
          className="h-full w-auto object-contain object-bottom opacity-20"
          style={{ filter: 'drop-shadow(0 0 60px rgba(245,158,11,0.3)) sepia(20%) brightness(0.9)' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Sparkles */}
        {[
          { top: '20%', left: '30%', size: 'w-2 h-2', color: 'bg-gold-400', delay: '0s', duration: '2s' },
          { top: '35%', right: '20%', size: 'w-1.5 h-1.5', color: 'bg-white', delay: '0.6s', duration: '2.5s' },
          { bottom: '40%', left: '25%', size: 'w-2 h-2', color: 'bg-gold-300', delay: '1.2s', duration: '1.8s' },
          { bottom: '30%', right: '30%', size: 'w-1 h-1', color: 'bg-white', delay: '0.3s', duration: '2.2s' },
        ].map((s, i) => (
          <div key={i} className={`absolute ${s.size} rounded-full ${s.color} opacity-70 animate-pulse`}
            style={{ top: s.top, bottom: (s as any).bottom, left: (s as any).left, right: (s as any).right, animationDelay: s.delay, animationDuration: s.duration }} />
        ))}
      </div>

      {/* Sign-in card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        {/* Logo + heading */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.1, type: 'spring', stiffness: 200 }}
            className="text-6xl mb-4 inline-block"
          >
            👑
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-white/50 mt-1">Sign in to your dashboard</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 p-8 shadow-2xl"
          style={{ background: 'rgba(17, 17, 24, 0.85)', backdropFilter: 'blur(24px)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm
                  bg-white/5 border border-white/10 text-white placeholder-white/25
                  focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/50
                  transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm
                    bg-white/5 border border-white/10 text-white placeholder-white/25
                    focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/50
                    transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
                >
                  <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-rose-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-gold-500 to-gold-600
                hover:from-gold-400 hover:to-gold-500
                text-white shadow-lg shadow-gold-500/20
                transition-all duration-200 active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              ← Public View
            </button>
            <div className="text-right">
              <p className="text-xs text-white/30">Demo · admin@pageant.com</p>
              <p className="text-xs text-white/30">Password: admin123</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
