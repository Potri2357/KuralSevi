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
  CheckCircle,
} from 'lucide-react';
import { IndicChakra, IndicEar } from '@/components/icons/indic';

type UserRole = 'admin' | 'district_officer' | 'panchayat_kiosk';

interface RoleOption {
  value: UserRole;
  label: string;
  tamilLabel: string;
  badge: string;
  description: string;
  icon: typeof ShieldCheck;
  color: string;
  borderColor: string;
  bgLight: string;
}

const ROLES: RoleOption[] = [
  {
    value: 'admin',
    label: 'Central Administrator',
    tamilLabel: 'மத்திய நிர்வாகி',
    badge: 'State & Central Level',
    description: 'System parameters, user management, audit logs, and aggregate data export.',
    icon: ShieldCheck,
    color: 'text-[#0B3064]',
    borderColor: 'border-[#0B3064]',
    bgLight: 'bg-[#EAF1FB]',
  },
  {
    value: 'district_officer',
    label: 'District Welfare Officer',
    tamilLabel: 'மாவட்ட நல அலுவலர்',
    badge: 'District Level',
    description: 'Citizen case assessments, AI voice transcripts, NSQF matching, and certificate approvals.',
    icon: Building2,
    color: 'text-[#C24810]',
    borderColor: 'border-[#C24810]',
    bgLight: 'bg-[#FFF4ED]',
  },
  {
    value: 'panchayat_kiosk',
    label: 'Gram Panchayat Kiosk',
    tamilLabel: 'கிராம பஞ்சாயத்து கியோஸ்க்',
    badge: 'Village Level',
    description: 'Kiosk voice intake terminal, outbound IVR call trigger, and direct citizen registration.',
    icon: Users,
    color: 'text-[#0A783C]',
    borderColor: 'border-[#0A783C]',
    bgLight: 'bg-[#EDF9F1]',
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="w-10 h-10 text-saffron-500 animate-spin" />
        <p className="text-sm font-medium text-slate-300">Verifying secure session…</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#071328] relative overflow-hidden flex flex-col justify-between">
      {/* Top 3-color National Accent Ribbon */}
      <div className="fixed top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#E05A1B] via-white to-[#0A783C] z-50 shadow-md" />

      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0B3064]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#E05A1B]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-[#0A783C]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Public Portal</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono">PM-AJAY GIA SECURE GATEWAY</span>
        </div>
      </header>

      {/* Main Form Center */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-4 py-8">
        <div className="bg-white/[0.04] border border-white/[0.12] rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
          {/* Logo & Emblems */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B3064] to-[#144282] border border-white/20 flex items-center justify-center shadow-lg shadow-[#0B3064]/50">
                <IndicEar className="w-8 h-8 text-white" strokeWidth={2.2} />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
              Kural Sevi
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-sans mt-1">
              குரல் செவி · <span className="text-[#E05A1B] font-medium">कुरल सेवी</span> · Single Sign-On
            </p>

            <div className="mt-3 inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1 rounded-full text-xs font-semibold text-slate-200">
              <IndicChakra className="w-3.5 h-3.5 text-[#E05A1B]" strokeWidth={2.5} />
              <span>Restricted Role-Based Governance Portal</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* ROLE DROPDOWN SELECTOR */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="role-select"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300"
                >
                  Select Portal Role <span className="text-[#E05A1B]">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Strict Role Enforcement</span>
              </div>

              {/* Styled Select Dropdown */}
              <div className="relative">
                <select
                  id="role-select"
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value as UserRole);
                    setError('');
                  }}
                  className="w-full appearance-none px-4 py-3.5 pr-10 rounded-xl bg-slate-800/90 border border-white/20 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A1B]/50 focus:border-[#E05A1B] transition-all cursor-pointer shadow-inner"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value} className="bg-slate-900 text-white py-2">
                      {r.label} ({r.tamilLabel}) — {r.badge}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  ▼
                </div>
              </div>

              {/* Dynamic Role Capability Card */}
              <div className="mt-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <div className={`p-2 rounded-lg ${activeRoleConfig.bgLight} shrink-0`}>
                  <activeRoleConfig.icon className={`w-4 h-4 ${activeRoleConfig.color}`} />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span>{activeRoleConfig.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                      {activeRoleConfig.badge}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-0.5 leading-relaxed text-[11px]">
                    {activeRoleConfig.description}
                  </p>
                </div>
              </div>

              {/* Quick Role Toggle Badges */}
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {ROLES.map((r) => {
                  const isSelected = selectedRole === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        setSelectedRole(r.value);
                        setError('');
                      }}
                      className={`text-[11px] py-1.5 px-2 rounded-lg font-medium transition-all text-center border ${
                        isSelected
                          ? 'bg-white/15 border-white/40 text-white font-bold shadow-sm'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      {r.value === 'admin' ? '🛡️ Admin' : r.value === 'district_officer' ? '🏛️ Officer' : '🌾 Kiosk'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider"
              >
                Official Email / Username <span className="text-[#E05A1B]">*</span>
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
                  placeholder="official@tn.gov.in"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-800/90 border border-white/20 text-white text-sm font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E05A1B]/50 focus:border-[#E05A1B] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider"
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
                  className="w-full pl-10 pr-12 py-3.5 rounded-xl bg-slate-800/90 border border-white/20 text-white text-sm font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E05A1B]/50 focus:border-[#E05A1B] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-medium flex items-start gap-3 shadow-lg">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-bold text-red-300">Access Restriction Warning</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {successMsg && (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-3 shadow-lg">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#E05A1B] to-[#C24810] hover:from-[#eb6729] hover:to-[#d45014] active:scale-[0.99] disabled:opacity-50 text-white rounded-xl px-6 py-4 font-bold text-sm transition-all duration-150 shadow-lg shadow-[#E05A1B]/20 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials & Role Privileges…</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Authenticate & Enter {activeRoleConfig.label}</span>
                </>
              )}
            </button>
          </form>

          {/* Strict Role Policy Notice */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <Compass className="w-3.5 h-3.5 text-[#E05A1B]" />
              <span>Strict Role-Based Access Enforcement</span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
              Users are authenticated against the National SC Welfare Registry. If your credentials do not match the selected role dropdown, access will be strictly denied.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-400">
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
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#E05A1B] animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
