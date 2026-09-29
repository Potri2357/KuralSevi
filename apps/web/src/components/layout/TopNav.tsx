'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Menu,
  X,
  PhoneCall,
  LogOut,
  ChevronDown,
  User,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

type UserRole = 'admin' | 'district_officer' | 'panchayat_kiosk';

interface UserProfile {
  full_name: string;
  role: UserRole;
  district?: string;
  panchayat?: string;
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [counts, setCounts] = useState<{ total: number; pending: number; slaBreached: number } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const supabase = createClient();

  // Load user profile
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setProfile(data.user as UserProfile);
        } else {
          supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return;
            const { data: dbProfile } = await supabase
              .from('user_profiles')
              .select('full_name, role, district, panchayat')
              .eq('id', user.id)
              .single();
            if (dbProfile) setProfile(dbProfile as UserProfile);
          });
        }
      })
      .catch(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
          if (!user) return;
          const { data: dbProfile } = await supabase
            .from('user_profiles')
            .select('full_name, role, district, panchayat')
            .eq('id', user.id)
            .single();
          if (dbProfile) setProfile(dbProfile as UserProfile);
        });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadDocketStats() {
      try {
        const res = await fetch('/api/cases', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const cases = data.cases || [];
          const total = cases.length;
          const pending = cases.filter((c: { officer_action: string }) => c.officer_action === 'pending').length;
          const slaBreached = cases.filter(
            (c: { officer_action: string; sla_deadline: string }) =>
              c.officer_action === 'pending' && new Date(c.sla_deadline) < new Date()
          ).length;
          if (isMounted) setCounts({ total, pending, slaBreached });
        }
      } catch {
        // silent fallback
      }
    }

    loadDocketStats();
    const timer = setInterval(loadDocketStats, 4000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    window.location.href = '/login';
  }

  const queueBadge = counts !== null ? (counts.pending > 0 ? String(counts.pending) : '0') : '0';
  const slaCount = counts !== null ? counts.slaBreached : 0;

  const navItems = [
    { href: '/officer', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/officer/cases', label: 'Queue', icon: Inbox, badge: queueBadge },
    { href: '/officer/calls', label: 'Calls', icon: PhoneCall },
    { href: '/officer/planning', label: 'Planning', icon: BarChart3 },
  ];

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const roleLabel: Record<UserRole, string> = {
    admin: 'System Administrator',
    district_officer: 'District Officer',
    panchayat_kiosk: 'Panchayat Kiosk',
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(11,48,100,0.05)] transition-all">
      <div className="h-[3px] w-full bg-[#E05A1B]" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4 sm:gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-[#0B3064] hover:bg-slate-100/80 md:hidden focus:outline-none focus:ring-2 focus:ring-[#0B3064] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link
              href="/officer"
              className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0B3064] flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-2xs group-hover:bg-[#144282] transition-colors shrink-0">
                KS
              </div>
              <span className="text-xl sm:text-2xl font-bold font-display text-[#0B3064] tracking-tight">
                Kural Sevi
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 h-full" aria-label="Main Navigation">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  id={`top-nav-${item.label.toLowerCase()}`}
                  className={cn(
                    'flex items-center gap-2 h-full text-sm font-semibold whitespace-nowrap transition-all relative',
                    active
                      ? 'text-[#0B3064] font-bold border-b-2 border-[#0B3064]'
                      : 'text-slate-600 hover:text-[#0B3064]'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#0B3064]' : 'text-slate-400')} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-bold ml-0.5 transition-colors',
                        item.badge === '0'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-[#0B3064] text-white'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: SLA badge + user menu */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/officer/cases?filter=sla_breached"
              className={cn(
                'hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full shadow-2xs whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]',
                slaCount > 0
                  ? 'text-[#C24810] bg-[#FFF4ED] hover:bg-[#FFE8DC] border border-[#FDD8C2]'
                  : 'text-[#0A783C] bg-[#EDF9F1] hover:bg-[#DDF4E4] border border-[#BBE8CB]'
              )}
              title={slaCount > 0 ? `${slaCount} case(s) breach SLA` : 'All cases within SLA'}
            >
              {slaCount > 0 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-[#E05A1B] shrink-0 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0A783C] shrink-0" />
              )}
              <span>{slaCount} SLA</span>
            </Link>

            {/* User menu dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0B3064]"
                aria-label="User menu"
                id="user-menu-btn"
              >
                <div className="w-7 h-7 rounded-full bg-[#0B3064] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs">
                  {initials}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {profile?.full_name || 'District Officer'}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-none">
                    {profile?.district ? `${profile.district} District` : 'District Welfare'}
                  </span>
                </div>
                <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', userMenuOpen && 'rotate-180')} />
              </button>

              {userMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                    aria-hidden="true"
                  />
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-[0_8px_40px_-4px_rgba(11,48,100,0.16)] border border-slate-100 z-50 overflow-hidden">
                    {/* Profile header */}
                    <div className="px-4 py-4 bg-gradient-to-br from-[#EAF1FB] to-white border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0B3064] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0B3064] leading-tight">{profile?.full_name || 'Loading…'}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {profile ? roleLabel[profile.role] : ''}
                          </p>
                          {profile?.district && (
                            <p className="text-xs text-slate-400 mt-0.5">{profile.district}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-2">
                      <button
                        onClick={() => { setUserMenuOpen(false); router.push('/officer'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Dashboard
                      </button>

                      <div className="my-1.5 border-t border-slate-100" />

                      <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        id="logout-btn"
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                      >
                        <LogOut className="w-4 h-4" />
                        {loggingOut ? 'Signing out…' : 'Sign Out'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 space-y-1.5 shadow-lg animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-150',
                  active
                    ? 'bg-[#EAF1FB] text-[#0B3064] border border-[#BACEEB]'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('w-4 h-4', active ? 'text-[#0B3064]' : 'text-slate-400')} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-bold border',
                    item.badge === '0'
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]'
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Mobile logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      )}
    </header>
  );
}
