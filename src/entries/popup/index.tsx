import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Shell } from '@/components/layout/shell';
import { Navbar } from '@/components/navigation/navbar';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { QuickAccess } from '@/components/panels/quick-access';
import '@/design/globals.css';
import '@/design/tokens.css';

function Popup() {
  const { theme, toggle } = useTheme();

  return (
    <Shell className="w-[360px]">
      <Navbar className="border-none pb-2" />
      <div className="flex-1 p-4 sm:p-6 flex flex-col gap-3 overflow-y-auto">
        <QuickAccess />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Appearance</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => void toggle()}
            aria-label={`Toggle theme (currently ${theme})`}
          >
            {theme === 'light' ? '☀' : '🌙'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Nexus Browser OS — new tab dashboard
        </p>
      </div>
    </Shell>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
