import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Lock, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authGoogle } from '../lib/api';
import { TopLoadingBar } from '../components/LoadingBar';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user, navigate]);

  const handleSuccess = async (cred: { credential?: string }) => {
    setLoading(true); setError('');
    try {
      const { token, user: userData } = await authGoogle(cred.credential!);
      login(token, userData);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error(err)
      setError(err?.data?.message || err?.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      {loading && <TopLoadingBar />}

      {/* Nav */}
      <nav className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#22c55e,#15803d)' }}>
            <span className="text-black font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-white font-headline tracking-wide">SEMSYNC</span>
        </div>
        <div className="flex gap-6">
          <a href="/" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }}>Features</a>
          <a href="/" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }}>About</a>
        </div>
      </nav>

      <main className="grow flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

        {/* Glowing orbs */}
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)', filter: 'blur(20px)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', filter: 'blur(20px)' }} />

        <div className="relative z-10 w-full max-w-105 animate-fade-up">
          {/* Card */}
          <div className="rounded-3xl p-8"
            style={{ background: 'rgba(16,16,24,0.85)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)' }}>

            <h1 className="text-3xl font-bold text-white mb-2 font-headline">Welcome back</h1>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Sign in with your institutional Google account to continue.
            </p>

            {/* Loading state */}
            {loading ? (
              <div className="flex flex-col items-center py-8 gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.07)' }} />
                  <div className="absolute inset-0 rounded-full animate-spin"
                    style={{ border: '2px solid transparent', borderTopColor: '#22c55e', animationDuration: '700ms' }} />
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Authenticating…</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center py-2">
                  <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={() => setError('Google login failed. Please try again.')}
                    shape="pill" size="large" text="signin_with" theme="filled_black"
                    useOneTap={false}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                    <Zap className="w-4 h-4 shrink-0" />{error}
                  </div>
                )}
              </div>
            )}

            {/* Footer links */}
            <div className="mt-8 pt-6 flex items-center justify-between text-xs"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
              <span className="flex items-center gap-1.5">Hope you enjoy! :)</span>
            </div>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © 2026 SemSync. By signing in you agree to our{' '}
            <a href="legal" className="underline underline-offset-2 hover:text-white transition-colors">Terms of Service</a>{' '}
            and{' '}
            <a href="legal" className="underline underline-offset-2 hover:text-white transition-colors">Privacy Policy</a>.
          </p>
        </div>
        
      </main>
    </div>
  );
}
