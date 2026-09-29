'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { LogOut } from 'lucide-react';
import { IndicEar, IndicChakra } from '@/components/icons/indic';
import { useState, useEffect } from 'react';

interface UserProfile {
  full_name: string;
  district?: string;
  panchayat?: string;
}

export function KioskShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('full_name, district, panchayat')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data as UserProfile);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EDF9F1] via-white to-[#EAF1FB] flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#BBE8CB]/60 shadow-sm">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#0A783C] via-[#E05A1B] to-[#0B3064]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0A783C] flex items-center justify-center shadow-sm">
              <IndicEar className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <span className="text-lg font-bold font-display text-[#0A783C] tracking-tight">Kural Sevi</span>
              <div className="flex items-center gap-1.5">
                <IndicChakra className="w-3 h-3 text-slate-400" strokeWidth={2} />
                <span className="text-xs text-slate-500 font-medium">Panchayat Kiosk</span>
              </div>
            </div>
          </div>

          {/* Location + Logout */}
          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-[#0B3064]">{profile.panchayat || profile.full_name}</p>
                {profile.district && (
                  <p className="text-xs text-slate-500">{profile.district}</p>
                )}
              </div>
            )}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              id="kiosk-logout-btn"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              {loggingOut ? '…' : 'Exit'}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Bottom kiosk bar */}
      <footer className="bg-[#0A783C] text-white text-center py-3 text-xs font-medium">
        PM-AJAY GIA · Kural Sevi · Panchayat Kiosk Mode &nbsp;|&nbsp; Ministry of Social Justice & Empowerment
      </footer>
    </div>
  );
}
