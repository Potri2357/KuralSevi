'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/officer', label: 'Overview', icon: '◈', exact: true },
  { href: '/officer/cases', label: 'Case Queue', icon: '⊞', exact: false },
  { href: '/officer/planning', label: 'District Planning', icon: '⬡', exact: false },
  { href: '/officer/beneficiary/new', label: 'New Enrollment', icon: '⊕', exact: false },
  { href: '/officer/export', label: 'Data Export', icon: '⤴', exact: false },
  { href: '/admin', label: 'Admin', icon: '⚙', exact: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen glass-strong border-r border-white/8 flex flex-col fixed top-0 left-0 z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/30">
            K
          </div>
          <div>
            <p className="font-bold text-sm text-[var(--text-primary)]">Kural Sevi</p>
            <p className="text-[10px] text-[var(--text-muted)]">PM-AJAY GIA · Officer Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">Dashboard</p>
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                'sidebar-item flex items-center gap-3 px-3 py-2.5 text-sm transition-all',
                active
                  ? 'active text-[var(--text-primary)] font-medium'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <span className={cn('text-base', active ? 'text-indigo-400' : 'text-[var(--text-muted)]')}>{item.icon}</span>
              {item.label}
              {item.href === '/officer/cases' && (
                <span className="ml-auto bg-rose-500/20 text-rose-400 text-[10px] px-1.5 py-0.5 rounded-full font-semibold border border-rose-500/20">
                  Live
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/8 space-y-3">
        {/* System status */}
        <div className="glass rounded-lg p-3 space-y-1.5">
          <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">System Status</p>
          {[
            { label: 'Voice API', ok: true },
            { label: 'Sarvam STT/TTS', ok: true },
            { label: 'Recommendation Engine', ok: true },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)]">{s.label}</span>
              <span className={cn('w-1.5 h-1.5 rounded-full', s.ok ? 'bg-emerald-400' : 'bg-rose-400')} />
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-[10px] text-[var(--text-muted)]">DPDP 2023 Compliant · v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
