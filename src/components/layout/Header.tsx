import { Menu, Bell, Search, Sun, Moon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-foreground">
              Welcome back
            </h2>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-4 hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileSearch(true)}
            className="sm:hidden"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-background"></span>
          </Button>
        </div>
      </div>

      {showMobileSearch && (
        <div className="fixed inset-0 z-50 bg-background sm:hidden">
          <div className="flex items-center gap-2 p-4 border-b">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="flex-1 bg-transparent border-0 text-lg text-foreground focus:outline-none"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileSearch(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
