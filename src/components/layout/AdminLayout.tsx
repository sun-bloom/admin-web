import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastProvider } from '@/lib/hooks/useToast';
import { useState } from 'react';

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r hidden lg:block">
        <Sidebar open={true} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="lg:hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <ToastProvider />
    </div>
  );
}
