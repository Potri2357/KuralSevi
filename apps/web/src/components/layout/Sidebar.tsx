'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  BarChart3,
  UserPlus,
  Download,
  Settings,
  ShieldCheck,
  Activity,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/officer', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/officer/cases', label: 'Case Queue', icon: Inbox, exact: false, badge: 'Live' },
  { href: '/officer/planning', label: 'District Planning', icon: BarChart3, exact: false },
  { href: '/officer/beneficiary/new', label: 'New Enrollment', icon: UserPlus, exact: false },
  { href: '/officer/export', label: 'Data Export', icon: Download, exact: false },
  { href: '/admin', label: 'Admin', icon: Settings, exact: false },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'w-64 min-h-screen bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col fixed top-0 left-0 z-50 transition-transform duration-200 ease-in-out md:translate-x-0 shadow-xs',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo / Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0B3064] rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-[var(--text-primary)] tracking-tight">Kural Sevi</p>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">PM-AJAY GIA Portal</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 md:hidden"
              aria-label="Close navigation sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
            Officer Console
          </p>
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onClose?.()}
                className={cn(
                  'sidebar-item flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors',
                  active
                    ? 'active text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB] font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-100'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#0B3064]' : 'text-slate-400')} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-[#FFF4ED] text-[#C24810] text-xs px-2 py-0.5 rounded-full font-bold border border-[#FDD8C2]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-subtle)] space-y-3 bg-slate-50/70">
          <div className="bg-white rounded-lg p-3 space-y-2 border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-[#0A783C]" />
              <span>System Health</span>
            </div>
            {[
              { label: 'Voice API & IVR', ok: true },
              { label: 'Sarvam STT / TTS', ok: true },
              { label: 'NSQF Match Engine', ok: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-medium">{s.label}</span>
                <span className="w-2 h-2 rounded-full bg-[#0A783C] shadow-2xs" />
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-[11px] text-[var(--text-muted)] font-semibold">DPDP Act 2023 Compliant · v1.2</p>
          </div>
        </div>
      </aside>
    </>
  );
}
