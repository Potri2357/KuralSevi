'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Download,
  PhoneCall,
  LogOut,
  Menu,
  X,
  Shield,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IndicEar } from '@/components/icons/indic';
import { createClient } from '@/utils/supabase/client';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/export', label: 'Data Export', icon: Download },
  { href: '/admin/calls', label: 'Call Records', icon: PhoneCall },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = createClient();
  const [profile, setProfile] = useState<{ full_name?: string; email?: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setProfile(data.user);
        } else {
          supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return;
            const { data: dbProfile } = await supabase
              .from('user_profiles')
              .select('full_name, role')
              .eq('id', user.id)
              .single();
            if (dbProfile) setProfile(dbProfile);
          });
        }
      })
      .catch(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
          if (!user) return;
          const { data: dbProfile } = await supabase
            .from('user_profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .single();
          if (dbProfile) setProfile(dbProfile);
        });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      {/* Universal 3px National Governance Saffron Accent Strip */}
      <div className="h-[3px] w-full bg-[#E05A1B]" aria-hidden="true" />

      {/* Sticky Top Header Bar (Matching TopNav exactly) */}
      <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(11,48,100,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand + Admin Badge */}
            <div className="flex items-center gap-3">
              <Link href="/admin" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-[#0B3064] flex items-center justify-center shadow-sm shadow-[#0B3064]/20 group-hover:scale-105 transition-transform">
                  <IndicEar className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base text-[#0B3064] font-display tracking-tight leading-tight">
                      Kural Sevi
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF1FB] text-[#0B3064] border border-[#BACEEB] font-mono">
                      <Shield className="w-2.5 h-2.5" />
                      Admin
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans leading-none">
                    மத்திய நிர்வாக போர்டல்
                  </span>
                </div>
              </Link>
            </div>

            {/* Middle: Desktop Navigation Items */}
            <nav className="hidden md:flex items-center gap-1">
              {ADMIN_NAV.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150',
                      active
                        ? 'bg-[#0B3064] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#0B3064] hover:bg-slate-100'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', active ? 'text-white' : 'text-slate-500')} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: User Profile & Logout */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-7 h-7 rounded-lg bg-[#0B3064] flex items-center justify-center text-white text-[11px] font-bold shadow-2xs">
                  {initials}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {profile?.full_name || 'System Admin'}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 leading-none">
                    Superuser
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                title="Sign out of Admin Console"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                {loggingOut ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 bg-white/95 px-4 py-3 space-y-1">
            {ADMIN_NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                    active
                      ? 'bg-[#0B3064] text-white'
                      : 'text-slate-600 hover:text-[#0B3064] hover:bg-slate-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-700 font-bold">
                {profile?.full_name || 'System Admin'}
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
