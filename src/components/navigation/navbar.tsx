import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface NavbarProps {
  className?: string;
}

/**
 * Minimalist top navigation: app identifier plus theme toggle.
 */
export function Navbar({ className }: NavbarProps) {
  const { theme, toggle } = useTheme();

  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between gap-4 border-b border-input bg-background px-4 py-1',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <span className="text-[10px] font-bold tracking-tighter">N</span>
        </div>
        <span className="text-sm font-semibold tracking-tight">
          Nexus Browser OS
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Sun className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </header>
  );
}
