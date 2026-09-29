'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { LogOut, Maximize2, Minimize2 } from 'lucide-react';
import { IndicEar, IndicChakra } from '@/components/icons/indic';
import { KuralSeviLogo } from '@/components/common/KuralSeviLogo';
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
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleKioskFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullScreen(false);
    }
  };

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
              .select('full_name, district, panchayat')
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
            .select('full_name, district, panchayat')
            .eq('id', user.id)
            .single();
          if (dbProfile) setProfile(dbProfile as UserProfile);
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

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col relative overflow-hidden">
      {/* Ambient soft glow orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#0A783C]/6 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-[#0B3064]/6 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top bar */}
      <header className="sticky top-0 z-40 glass-nav">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#0A783C] via-[#E05A1B] to-[#0B3064]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <KuralSeviLogo
            href="/kiosk"
            size="md"
            badge="Panchayat Kiosk"
            badgeVariant="green"
            textColor="text-[#0A783C]"
            subtitle="Salem District · PM-AJAY GIA"
          />

          {/* Location + Logout */}
          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-[#0B3064]">{profile.panchayat || profile.full_name}</p>
                {profile.district && (
                  <p className="text-xs text-slate-500 font-medium">{profile.district}</p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={toggleKioskFullscreen}
              id="kiosk-shell-fullscreen-btn"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer neuro-btn ${
                isFullScreen
                  ? 'bg-[#0B3064] text-white border border-[#0B3064]'
                  : 'glass-panel text-[#0B3064] hover:bg-white'
              }`}
              title={isFullScreen ? 'Exit Kiosk Fullscreen' : 'Enter Kiosk Stand Mode'}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Kiosk</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>⤢ Kiosk Mode</span>
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              id="kiosk-logout-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50/80 glass-pill border border-red-200/80 transition-all cursor-pointer"
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
