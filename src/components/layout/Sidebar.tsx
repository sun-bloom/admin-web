import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  X,
  ChevronDown,
  Store,
  Tag,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Categories', href: '/categories', icon: Tag },
  { name: 'Settings', href: '/settings/general', icon: Settings },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Admin</span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-muted rounded-md transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => onClose()}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-muted-foreground rounded-lg hover:bg-muted transition-colors">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                A
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@example.com</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
