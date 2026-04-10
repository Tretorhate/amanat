'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { RouteGuard } from '@/components/common/RouteGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RouteGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </RouteGuard>
  );
}
