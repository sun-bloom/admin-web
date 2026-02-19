import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  className?: string;
}

const routeNames: Record<string, string> = {
  'dashboard': 'Dashboard',
  'products': 'Products',
  'orders': 'Orders',
  'customers': 'Customers',
  'settings': 'Settings',
  'add': 'Add',
  'general': 'General',
  'delivery': 'Delivery',
  'payment': 'Payment',
  'users': 'Users',
};

function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [
    { label: 'Home', path: '/' }
  ];

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1;
    const label = routeNames[segment] || segment;
    const path = '/' + segments.slice(0, index + 1).join('/');

    if (label && label !== 'admin') {
      items.push({
        label,
        path: isLast ? undefined : path,
      });
    }
  });

  return items;
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const location = useLocation();
  const items = getBreadcrumbItems(location.pathname);

  return (
    <nav className={cn('flex items-center text-sm text-muted-foreground', className)}>
      {items.map((item, index) => (
        <div key={item.path || item.label} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0" />
          )}
          {item.path ? (
            <Link
              to={item.path}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
