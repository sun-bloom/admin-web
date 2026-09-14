import { useState, useEffect } from 'react';
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
  Tag,
  Sliders,
  Truck,
  CreditCard,
  UserCog,
  MessageCircle,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Product List', href: '/product-list', icon: Package },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Order Consultants', href: '/order-consultants', icon: MessageCircle },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Categories', href: '/categories', icon: Tag },
];

const settingsSubmenu = [
  { name: 'Delivery', href: '/settings/delivery', icon: Truck },
  { name: 'Payment', href: '/settings/payment', icon: CreditCard },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();

  const isSettingsRoute = location.pathname.startsWith('/settings');
  const [settingsExpanded, setSettingsExpanded] = useState(isSettingsRoute);

  // Auto-expand Settings group whenever user navigates to any /settings route
  useEffect(() => {
    if (isSettingsRoute) {
      setSettingsExpanded(true);
    }
  }, [isSettingsRoute, location.pathname]);

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
          {/* Brand Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Sunbloom Adorn"
                className="h-9 w-9 rounded-full object-cover border border-amber-300/40 shadow-xs ring-1 ring-amber-500/20"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-wide text-foreground">Sunbloom Adorn</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest -mt-0.5">Atelier Control</span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {mainNavigation.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => onClose()}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium uppercase tracking-wider rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-[#C5A059]/15 text-[#9E7B31] dark:text-[#E5C378] font-semibold border-l-2 border-[#C5A059]'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-4 w-4',
                      isActive ? 'text-[#C5A059]' : 'text-muted-foreground'
                    )}
                  />
                  {item.name}
                </NavLink>
              );
            })}

            {/* Expandable Settings Group */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setSettingsExpanded((prev) => !prev)}
                aria-expanded={settingsExpanded}
                className={cn(
                  'flex items-center justify-between w-full px-3.5 py-2.5 text-xs font-medium uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer',
                  isSettingsRoute
                    ? 'bg-[#C5A059]/15 text-[#9E7B31] dark:text-[#E5C378] font-semibold border-l-2 border-[#C5A059]'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <Settings
                    className={cn(
                      'h-4 w-4',
                      isSettingsRoute ? 'text-[#C5A059]' : 'text-muted-foreground'
                    )}
                  />
                  <span>Settings</span>
                </div>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-200',
                    settingsExpanded ? 'rotate-180 text-foreground' : 'text-muted-foreground'
                  )}
                />
              </button>

              {/* Submenu Items */}
              {settingsExpanded && (
                <div className="mt-1 ml-4 pl-3 border-l border-border/80 space-y-1 py-1">
                  {settingsSubmenu.map((sub) => {
                    const isSubActive = location.pathname === sub.href;
                    return (
                      <NavLink
                        key={sub.name}
                        to={sub.href}
                        onClick={() => onClose()}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-all duration-150',
                          isSubActive
                            ? 'bg-[#C5A059]/20 text-[#9E7B31] dark:text-[#E5C378] font-semibold shadow-xs'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        )}
                      >
                        <sub.icon
                          className={cn(
                            'h-3.5 w-3.5',
                            isSubActive ? 'text-[#C5A059]' : 'text-muted-foreground/80'
                          )}
                        />
                        <span>{sub.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
