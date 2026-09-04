'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  BarChart3,
  UserPlus,
  Download,
  Settings,
  AlertTriangle,
  Menu,
  X,
  PhoneCall,
} from 'lucide-react';

import { IndicEar } from '@/components/icons/indic';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/officer', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/officer/cases', label: 'Queue', icon: Inbox, badge: '23' },
  { href: '/officer/planning', label: 'Planning', icon: BarChart3 },
  { href: '/officer/beneficiary/new', label: 'Intake', icon: UserPlus },
  { href: '/officer/export', label: 'Export', icon: Download },
  { href: '/admin', label: 'Admin', icon: Settings },
];

export function TopNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(11,48,100,0.05)] transition-all">
      {/* 3px Top Saffron National Scheme Accent Rule */}
      <div className="h-[3px] w-full bg-[#E05A1B]" aria-hidden="true" />

      {/* Main container perfectly aligned with webpage max-w-7xl */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4 sm:gap-6">
          {/* Brand Mark (Navy KS square logo + bold Kural Sevi text) */}
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

          {/* Desktop Navigation Tabs: Clean underline indicator & dark pill badges */}
          <nav
            className="hidden md:flex items-center gap-6 lg:gap-8 h-full"
            aria-label="Main Navigation"
          >
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
                  {item.badge && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#0B3064] text-white ml-0.5"
                    >
                      {item.badge === '23' ? '12' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: 2 SLA Alert Pill + Avatar N */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Call Records Dashboard */}
            <a
              href="http://localhost:8000/call-records"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#0B3064] bg-[#EAF1FB] hover:bg-[#D9E6F7] border border-[#BACEEB] px-3 py-1.5 rounded-full shadow-2xs whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
              title="Open Call Records & Verified Transcripts Dashboard"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#0B3064] shrink-0" />
              <span>Call Records</span>
            </a>

            {/* SLA Alert Badge */}
            <Link
              href="/officer/cases?filter=sla_breached"
              className="flex items-center gap-1.5 text-xs font-bold text-[#C24810] bg-[#FFF4ED] hover:bg-[#FFE8DC] border border-[#FDD8C2] px-3 py-1.5 rounded-full shadow-2xs whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
              title="2 cases breach statutory SLA today"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#E05A1B] shrink-0" />
              <span>2 SLA</span>
            </Link>

            {/* Officer Avatar Button */}
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-[#0B3064] hover:bg-[#144282] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#0B3064] cursor-pointer"
              aria-label="Officer Profile"
            >
              N
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
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
                {item.badge && (
                  <span className="text-xs bg-[#FFF4ED] text-[#C24810] border border-[#FDD8C2] px-2 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
