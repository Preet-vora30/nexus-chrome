import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WidgetFocus } from './widget-focus';
import type { FocusSettings } from '@/types';

const originalChrome = globalThis.chrome;

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = undefined;
  vi.useFakeTimers();
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = originalChrome;
  vi.useRealTimers();
});

function setupFocus(overrides: Partial<FocusSettings> = {}) {
  const settings: FocusSettings = {
    focusMinutes: 1,
    breakMinutes: 0,
    notificationsEnabled: false,
    ...overrides,
  };
  const onToggleNotifications = vi.fn();
  const onSessionCompleted = vi.fn();
  const utils = render(
    <WidgetFocus
      visible
      settings={settings}
      sessionsCompleted={0}
      onToggleNotifications={onToggleNotifications}
      onSessionCompleted={onSessionCompleted}
    />
  );
  return { onSessionCompleted, ...utils };
}

describe('WidgetFocus', () => {
  it('shows the configured duration and starts paused', () => {
    setupFocus();
    expect(screen.getByText('1:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start focus timer' })).toBeEnabled();
  });

  it('counts down while running and pauses correctly', () => {
    const { onSessionCompleted } = setupFocus();
    const start = screen.getByRole('button', { name: 'Start focus timer' });
    fireEvent.click(start);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('0:59')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pause focus timer' }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('0:59')).toBeInTheDocument();
    expect(onSessionCompleted).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Start focus timer' }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('0:58')).toBeInTheDocument();
  });

  it('resumes after a pause instead of restarting the full duration', () => {
    setupFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Start focus timer' }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pause focus timer' }));

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start focus timer' }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('0:58')).toBeInTheDocument();
  });

  it('resets to the full duration and stops the run', () => {
    setupFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Start focus timer' }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset timer' }));

    expect(screen.getByText('1:00')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start focus timer' })
    ).toBeEnabled();
  });

  it('notifies once when the session ends', () => {
    const { onSessionCompleted } = setupFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Start focus timer' }));

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(onSessionCompleted).toHaveBeenCalledTimes(1);
    expect(screen.getByText('1:00')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start focus timer' })
    ).toBeEnabled();
  });

  it('reports the number of completed sessions', () => {
    setupFocus();
    // Rendered from the `sessionsCompleted` prop.
    expect(screen.getByText('0 focus sessions completed')).toBeInTheDocument();
  });

  it('asks for notification permission only when enabled', () => {
    const onToggleNotifications = vi.fn();
    render(
      <WidgetFocus
        visible
        settings={{
          focusMinutes: 1,
          breakMinutes: 0,
          notificationsEnabled: false,
        }}
        sessionsCompleted={0}
        onToggleNotifications={onToggleNotifications}
        onSessionCompleted={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'Enable completion notifications',
      })
    );
    expect(onToggleNotifications).toHaveBeenCalledWith(true);
  });
});
