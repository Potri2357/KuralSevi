'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  ShieldCheck,
  Building2,
  Users,
  Compass,
  ArrowLeft,
  AlertTriangle,
  Lock,
  Mail,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { IndicChakra, IndicEar } from '@/components/icons/indic';
import { KuralSeviIcon, KuralSeviLogo } from '@/components/common/KuralSeviLogo';

type UserRole = 'admin' | 'district_officer' | 'panchayat_kiosk';

interface RoleOption {
  value: UserRole;
  label: string;
  badge: string;
  description: string;
  icon: typeof ShieldCheck;
  textColor: string;
  borderColor: string;
  bgSubtle: string;
  borderSubtle: string;
}

const ROLES: RoleOption[] = [
  {
    value: 'admin',
    label: 'Central Administrator',
    badge: 'State & Central Level',
    description: 'System parameters, user management, audit logs, and aggregate data export.',
    icon: ShieldCheck,
    textColor: 'text-[#0B3064]',
    borderColor: 'border-[#0B3064]',
    bgSubtle: 'bg-[#EAF1FB]',
    borderSubtle: 'border-[#BACEEB]',
  },
  {
    value: 'district_officer',
    label: 'District Welfare Officer',
    badge: 'District Level',
    description: 'Citizen case assessments, AI voice transcripts, NSQF matching, and certificate approvals.',
    icon: Building2,
    textColor: 'text-[#C24810]',
    borderColor: 'border-[#E05A1B]',
    bgSubtle: 'bg-[#FFF4ED]',
    borderSubtle: 'border-[#FDD8C2]',
  },
  {
    value: 'panchayat_kiosk',
    label: 'Gram Panchayat Kiosk',
    badge: 'Village Level',
    description: 'Kiosk voice intake terminal, outbound IVR call trigger, and direct citizen registration.',
    icon: Users,
    textColor: 'text-[#0A783C]',
    borderColor: 'border-[#0A783C]',
    bgSubtle: 'bg-[#EDF9F1]',
    borderSubtle: 'border-[#BBE8CB]',
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || null;
  const initialRoleParam = searchParams.get('role') as UserRole | null;

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    initialRoleParam && ['admin', 'district_officer', 'panchayat_kiosk'].includes(initialRoleParam)
      ? initialRoleParam
      : 'district_officer'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if session already active
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          const userRole = data.user.role as UserRole;
          const dest = redirectTo || (userRole === 'admin' ? '/admin' : userRole === 'panchayat_kiosk' ? '/kiosk' : '/officer');
          router.replace(dest);
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => {
        setCheckingSession(false);
      });
  }, [redirectTo, router]);

  const activeRoleConfig = ROLES.find((r) => r.value === selectedRole) || ROLES[1];

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: selectedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Login failed. Please verify your credentials and selected role.');
        setLoading(false);
        return;
      }

      setSuccessMsg(`Authenticated successfully as ${activeRoleConfig.label}. Redirecting…`);

      // Determine proper destination URL
      const finalDest = redirectTo || data.redirectUrl || '/officer';
      setTimeout(() => {
        window.location.href = finalDest;
      }, 500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(`Unable to connect to authentication service: ${message}`);
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center gap-4 text-slate-700">
        <Loader2 className="w-9 h-9 text-[#0B3064] animate-spin" />
        <p className="text-xs font-semibold text-slate-600">Verifying secure session…</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)] relative overflow-hidden flex flex-col justify-between selection:bg-[#0B3064]/10 selection:text-[#0B3064]">
      {/* Universal 3px National Governance Saffron Accent Strip */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-[#E05A1B] z-50 shadow-xs" aria-hidden="true" />

      {/* Decorative ambient subtle gradients (matching body) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0B3064]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#E05A1B]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-[#0A783C]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <KuralSeviLogo href="/" size="sm" badge="Single Sign-On" badgeVariant="blue" />

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0B3064] transition-colors bg-white/80 border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-2xs backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#0B3064]" />
            <span>Public Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Login Card Container */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-4 sm:py-6">
        <div className="bg-white/95 rounded-3xl border border-slate-200/90 shadow-[0_12px_40px_-6px_rgba(11,48,100,0.08)] p-6 sm:p-9 backdrop-blur-xl">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <KuralSeviIcon size="xl" className="shadow-lg shadow-[#0B3064]/25" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-[#0B3064] font-display tracking-tight">
              Kural Sevi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-sans mt-0.5">
              குரல் செவி · <span className="text-[#E05A1B] font-medium">कुरल सेवी</span> · Portal Authentication
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* ROLE DROPDOWN SELECTOR */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="role-select"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Select Portal Role <span className="text-[#E05A1B]">*</span>
                </label>
              </div>

              {/* Styled Dropdown */}
              <div className="relative">
                <select
                  id="role-select"
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value as UserRole);
                    setError('');
                  }}
                  className="w-full appearance-none px-4 py-3.5 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3064]/15 focus:border-[#0B3064] focus:bg-white transition-all cursor-pointer shadow-2xs"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value} className="text-slate-900 py-2">
                      {r.label} — {r.badge}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 flex items-center justify-center">
                  <ChevronDown className="w-4 h-4 stroke-[2.2]" />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
              >
                Official Email <span className="text-[#E05A1B]">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="official@gov.in"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3064]/15 focus:border-[#0B3064] focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
              >
                Password <span className="text-[#E05A1B]">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3064]/15 focus:border-[#0B3064] focus:bg-white transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5 shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-bold text-red-800">Access Restriction Warning</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-[#EDF9F1] border border-[#BBE8CB] text-[#0A783C] text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#0A783C] shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0B3064] hover:bg-[#144282] active:bg-[#082142] disabled:opacity-60 text-white rounded-xl px-6 py-3.5 font-bold text-sm transition-all duration-150 shadow-xs cursor-pointer mt-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials & Role…</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to {activeRoleConfig.label}</span>
                </>
              )}
            </button>
          </form>

          {/* Strict Role Policy Notice */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
              <Compass className="w-3.5 h-3.5 text-[#0B3064]" />
              <span>Strict Role-Based Governance Access</span>
            </div>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed font-sans">
              Credentials are authenticated against the National SC Welfare Registry. If your account role does not match the selected portal, access is strictly denied.
            </p>
          </div>
        </div>
      </div>

      {/* Official Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-500 font-medium">
        <p>
          Ministry of Social Justice & Empowerment · Government of India · PM-AJAY GIA
        </p>
      </footer>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#0B3064] animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
