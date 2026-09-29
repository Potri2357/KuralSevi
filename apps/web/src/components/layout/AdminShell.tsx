'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Settings, BookOpen, Database, Sliders, Activity, PhoneCall, ArrowLeft, LogOut, Users, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { IndicEar } from '@/components/icons/indic';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: Settings, exact: true },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/officer/calls', label: 'Call Records', icon: PhoneCall },
  { href: '/admin/catalog', label: 'NSQF Catalog', icon: BookOpen },
  { href: '/admin/ingestion', label: 'Data Ingestion', icon: Database },
  { href: '/admin/weights', label: 'AHP Weights', icon: Sliders },
  { href: '/admin/health', label: 'System Health', icon: Activity },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#0B3064] flex items-center justify-center">
              <IndicEar className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold font-display text-lg">Kural Sevi</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Shield className="w-3 h-3 text-[#E05A1B]" />
            <span className="text-[#E05A1B] text-xs font-bold uppercase tracking-widest">Admin Console</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {ADMIN_NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                  active
                    ? 'bg-[#0B3064] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-white' : 'text-slate-500')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to officer + user */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <Link
            href="/officer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Officer Dashboard
          </Link>

          {/* Profile card */}
          <div className="flex items-center gap-3 px-3 py-3 bg-slate-800 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-[#0B3064] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{profile?.full_name || 'Administrator'}</p>
              <p className="text-slate-500 text-xs">System Admin</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              id="admin-logout-btn"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="h-1 bg-gradient-to-r from-[#E05A1B] via-[#0B3064] to-[#0A783C]" />
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
