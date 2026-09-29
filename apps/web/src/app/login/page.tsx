'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { IndicChakra, IndicEar } from '@/components/icons/indic';
import { Eye, EyeOff, LogIn, Loader2, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  const supabase = createClient();

  // If already logged in, redirect immediately
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        const dest = redirectTo || roleDashboard(profile?.role);
        router.replace(dest);
      } else {
        setCheckingSession(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !data.user) {
      setError(authError?.message || 'Invalid credentials. Please try again.');
      setLoading(false);
      return;
    }

    // Fetch role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', data.user.id)
      .single();

    if (!profile?.is_active) {
      await supabase.auth.signOut();
      setError('Your account is deactivated. Please contact your administrator.');
      setLoading(false);
      return;
    }

    const dest = redirectTo || roleDashboard(profile?.role);
    router.replace(dest);
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0B3064] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-[#EAF1FB] to-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Top accent strip */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#E05A1B] via-[#0B3064] to-[#0A783C] z-50" />

      {/* Background decorative circles */}
      <div className="absolute top-[-80px] right-[-80px] w-[300px] h-[300px] rounded-full bg-[#0B3064]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-60px] w-[250px] h-[250px] rounded-full bg-[#E05A1B]/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo + Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0B3064] flex items-center justify-center shadow-lg">
              <IndicEar className="w-8 h-8 text-white" strokeWidth={2.2} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#0B3064] font-display tracking-tight mb-1">
            Kural Sevi
          </h1>
          <p className="text-sm text-slate-500 font-sans">
            குரல் செவி · <span className="text-[#E05A1B]">कुरल सेवी</span>
          </p>
          <div className="mt-3 inline-flex items-center gap-2 bg-[#EAF1FB] border border-[#BACEEB] px-3 py-1 rounded-full text-xs font-bold text-[#0B3064]">
            <IndicChakra className="w-3.5 h-3.5" strokeWidth={2.5} />
            PM-AJAY GIA · Official Portal
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[0_4px_40px_-4px_rgba(11,48,100,0.12)] border border-slate-100 p-8">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-[#0B3064]" />
            <h2 className="text-lg font-bold text-[#0B3064] font-sans">Secure Sign In</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Official Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gov.in"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3064]/20 focus:border-[#0B3064] transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3064]/20 focus:border-[#0B3064] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium flex items-start gap-2">
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0B3064] hover:bg-[#144282] active:bg-[#082142] disabled:opacity-60 text-white rounded-xl px-6 py-3.5 font-bold text-sm transition-all duration-150 shadow-sm mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Signing in…' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Role legend */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3 font-medium">Access is restricted by role</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Admin', color: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]', emoji: '🛡️' },
                { label: 'District Officer', color: 'bg-[#FFF4ED] text-[#C24810] border-[#FDD8C2]', emoji: '🏛️' },
                { label: 'Kiosk (GP)', color: 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]', emoji: '📋' },
              ].map((r) => (
                <div
                  key={r.label}
                  className={`${r.color} border rounded-lg py-2 px-1 text-xs font-semibold`}
                >
                  <div className="text-base mb-0.5">{r.emoji}</div>
                  {r.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Ministry of Social Justice & Empowerment · PM-AJAY GIA
        </p>
      </div>
    </main>
  );
}

function roleDashboard(role?: string): string {
  switch (role) {
    case 'admin': return '/admin';
    case 'panchayat_kiosk': return '/kiosk';
    default: return '/officer';
  }
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0B3064] animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
