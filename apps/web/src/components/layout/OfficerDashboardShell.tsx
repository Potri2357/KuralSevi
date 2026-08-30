'use client';
import { TopNav } from './TopNav';

export function OfficerDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-base)]">
      {/* Top Navigation Bar (replaces sidebar) */}
      <TopNav />

      {/* Full-width content container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {children}
      </main>
    </div>
  );
}
