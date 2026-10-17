import * as React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { ThemeMode, DashboardSettings } from '@/types';

const ACCENT_COLORS = [
  { id: 'blue', label: 'Electric blue', color: 'hsl(217 91% 60%)' },
  { id: 'violet', label: 'Soft violet', color: 'hsl(265 85% 60%)' },
  { id: 'cyan', label: 'Subtle cyan', color: 'hsl(188 92% 58%)' },
];

const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system'];
const CLOCK_FORMATS: ('12' | '24')[] = ['12', '24'];
const DENSITIES: ('comfortable' | 'compact' | 'spacious')[] = [
  'comfortable',
  'compact',
  'spacious',
];

export interface CustomizationPanelProps {
  open: boolean;
  onClose: () => void;
  settings: DashboardSettings;
  onSave: (settings: Partial<DashboardSettings>) => void;
}

/**
 * Personalization panel: theme, accent, clock format, density, animations.
 */
export function CustomizationPanel({
  open,
  onClose,
  settings,
  onSave,
}: CustomizationPanelProps) {
  const [theme, setTheme] = React.useState(settings.theme);
  const [accentColor, setAccentColor] = React.useState(settings.accentColor);
  const [clockFormat, setClockFormat] = React.useState(settings.clockFormat);
  const [density, setDensity] = React.useState(settings.density);
  const [animationsEnabled, setAnimationsEnabled] = React.useState(
    settings.animationsEnabled
  );

  const modeLabel = (mode: string) =>
    mode.charAt(0).toUpperCase() + mode.slice(1);

  const handleSave = () => {
    onSave({
      theme,
      accentColor,
      clockFormat,
      density,
      animationsEnabled,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Customize Nexus"
      description="Adjust appearance and behavior to your liking."
      onConfirm={handleSave}
      confirmLabel="Save"
      cancelLabel="Cancel"
    >
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Appearance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">Theme</label>
              <div className="flex gap-2">
                {THEME_MODES.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className={cn(
                      'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                      theme === mode
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {modeLabel(mode)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">Accent color</label>
              <div className="flex gap-2">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setAccentColor(c.color)}
                    className={cn(
                      'h-9 w-9 rounded-full border transition-all',
                      accentColor === c.color
                        ? 'ring-2 ring-ring border-transparent'
                        : 'border-input hover:scale-110'
                    )}
                    style={{ backgroundColor: c.color }}
                    aria-label={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Behavior
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Clock format</span>
              <div className="flex gap-1">
                {CLOCK_FORMATS.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setClockFormat(fmt)}
                    className={cn(
                      'h-8 w-8 rounded-md border text-xs font-medium transition-colors',
                      clockFormat === fmt
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Animations</span>
              <Switch
                checked={animationsEnabled}
                onChange={(event) => setAnimationsEnabled(event.target.checked)}
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Dashboard density
          </h3>
          <div className="flex gap-2">
            {DENSITIES.map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                  density === d
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input text-muted-foreground hover:bg-accent'
                )}
              >
                {modeLabel(d)}
              </button>
            ))}
          </div>
        </section>
      </div>
    </Dialog>
  );
}
