import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Shell } from '@/components/layout/shell';
import { Navbar } from '@/components/navigation/navbar';
import { QuickAccess } from '@/components/panels/quick-access';
import '@/design/globals.css';
import '@/design/tokens.css';

function SidePanel() {
  return (
    <Shell className="w-[320px]">
      <Navbar className="border-none pb-2" />
      <div className="flex-1 p-3 sm:p-4 flex flex-col gap-3 overflow-y-auto">
        <QuickAccess />
        <p className="text-xs text-muted-foreground">Nexus Browser OS</p>
      </div>
    </Shell>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <SidePanel />
  </React.StrictMode>
);

