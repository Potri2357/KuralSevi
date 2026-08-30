'use client';
import { usePathname } from 'next/navigation';

const breadcrumbs: Record<string, string> = {
  '/officer': 'Overview',
  '/officer/cases': 'Case Queue',
  '/officer/planning': 'District Planning',
  '/officer/export': 'Data Export',
  '/admin': 'Admin',
};

export function TopNav({ district = 'Demo District', state = 'Tamil Nadu' }: { district?: string; state?: string }) {
  const pathname = usePathname();
  const title = breadcrumbs[pathname] ?? 'Kural Sevi';

  return (
    <header className="h-14 border-b border-white/8 glass flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
        <span className="text-[var(--text-muted)] text-xs">·</span>
        <span className="text-xs text-[var(--text-muted)]">{district}, {state}</span>
      </div>
      <div className="flex items-center gap-4">
        {/* SLA alert indicator */}
        <div className="flex items-center gap-1.5 text-xs text-amber-400">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
          2 cases breach SLA today
        </div>
        {/* Officer avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer" title="Officer Profile">
          DK
        </div>
      </div>
    </header>
  );
}
