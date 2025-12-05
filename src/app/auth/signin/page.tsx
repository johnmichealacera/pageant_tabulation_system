'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials');
      } else {
        // Get the session to check user role
        const session = await getSession();
        const userRole = (session?.user as any)?.role;
        if (userRole === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/judge');
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" 
         style={{
           background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
           backgroundSize: '400% 400%',
           animation: 'gradientShift 15s ease infinite'
         }}>
      {/* Decorative crown pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M30 10L35 20L45 22L38 30L40 40L30 35L20 40L22 30L15 22L25 20Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '120px 120px'
      }}></div>
      
      {/* Beautiful Pageant Winner Image */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 md:w-2/5 opacity-30 pointer-events-none hidden md:flex items-center justify-end pr-8">
        <div className="relative h-full w-full max-w-md">
          {/* Using a high-quality pageant winner image from free source */}
          {/* This image is from Pixabay - royalty free and beautiful */}
          <img 
            src="/pageant-winner.png" 
            alt="Pageant Winner"
            className="h-full w-auto object-contain object-center"
            style={{
              filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.3)) brightness(1.1)',
            }}
            onError={(e) => {
              // Fallback to local image if external image fails
              const target = e.target as HTMLImageElement;
              target.src = '/pageant-winner.png';
              target.onerror = () => {
                // Final fallback to placeholder
                target.style.display = 'none';
                const placeholder = target.parentElement?.querySelector('.placeholder') as HTMLElement;
                if (placeholder) placeholder.style.display = 'block';
              };
            }}
          />
          
          {/* Placeholder fallback - shows if all images fail */}
          <div className="placeholder hidden absolute inset-0 flex items-center justify-center text-white/40 text-sm text-center px-4">
            <div>
              <div className="text-6xl mb-2">👑</div>
              <p>Place your pageant winner image at:</p>
              <p className="font-mono text-xs mt-1">/public/pageant-winner.png</p>
              <p className="text-xs mt-2">Or download from:</p>
              <p className="font-mono text-xs">Pixabay.com (search: pageant winner)</p>
            </div>
          </div>
          
          {/* Sparkles overlay on top of the image */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-80 animate-pulse" style={{animationDelay: '0s', animationDuration: '2s'}}></div>
            <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-yellow-300 rounded-full opacity-80 animate-pulse" style={{animationDelay: '0.5s', animationDuration: '2.5s'}}></div>
            <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-white rounded-full opacity-80 animate-pulse" style={{animationDelay: '1s', animationDuration: '1.8s'}}></div>
            <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-yellow-300 rounded-full opacity-80 animate-pulse" style={{animationDelay: '1.5s', animationDuration: '2.2s'}}></div>
            <div className="absolute top-1/2 left-1/5 w-1.5 h-1.5 bg-white rounded-full opacity-70 animate-pulse" style={{animationDelay: '0.8s', animationDuration: '2.3s'}}></div>
            <div className="absolute bottom-1/2 right-1/5 w-2 h-2 bg-yellow-300 rounded-full opacity-70 animate-pulse" style={{animationDelay: '1.2s', animationDuration: '1.9s'}}></div>
          </div>
        </div>
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div>
          <div className="text-center mb-4">
            <span className="text-5xl">👑</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white drop-shadow-lg">
            Sign in to Pageant System
          </h2>
          <p className="mt-2 text-center text-sm text-white/90">
            Admin or Judge Login
          </p>
        </div>
        <form className="mt-8 space-y-6 bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-8 border border-white/20" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-indigo-600 hover:text-indigo-500 text-sm"
            >
              Back to Public View
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-white/90 backdrop-blur-sm rounded-md border border-white/30">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials:</h3>
          <p className="text-xs text-blue-600">
            <strong>Admin:</strong> admin@pageant.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
