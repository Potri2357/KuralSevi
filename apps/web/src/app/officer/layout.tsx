import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Officer Dashboard' };

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
