import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from './command-palette';
import type { CommandPaletteApi } from './command-palette';

function renderPalette(
  initialQuery: string,
  onRun: (run: (api: CommandPaletteApi) => Promise<void>) => Promise<void>
) {
  return render(
    <CommandPalette
      open
      onClose={() => {}}
      query={initialQuery}
      onQueryChange={() => {}}
      onRun={onRun}
    />
  );
}

describe('CommandPalette', () => {
  it('lists every command when the query is empty', async () => {
    const onRun = vi.fn(async () => {});
    renderPalette('', onRun);

    expect(await screen.findByText('Create a note')).toBeInTheDocument();
    expect(screen.getByText('Toggle theme')).toBeInTheDocument();
    expect(screen.getByText('Open downloads')).toBeInTheDocument();
  });

  it('filters commands by the typed query', async () => {
    const onRun = vi.fn(async () => {});
    renderPalette('theme', onRun);

    expect(await screen.findByText('Toggle theme')).toBeInTheDocument();
    expect(screen.queryByText('Create a note')).not.toBeInTheDocument();
  });

  it('runs the selected command through the api', async () => {
    const createNote = vi.fn(async () => {});
    const toggleTheme = vi.fn(async () => {});
    const api: CommandPaletteApi = {
      query: '',
      openTab: vi.fn(async () => {}),
      switchToTab: vi.fn(async () => {}),
      openChromePage: vi.fn(async () => {}),
      toggleTheme,
      createNote,
      createTask: vi.fn(async () => {}),
      resetDashboardLayout: vi.fn(async () => {}),
    };
    const onRun = vi.fn(async (run: (api: CommandPaletteApi) => Promise<void>) => {
      await run(api);
    });
    renderPalette('', onRun);

    const entry = await screen.findByText('Create a note');
    fireEvent.click(entry.closest('button') as HTMLElement);

    expect(createNote).toHaveBeenCalledTimes(1);
  });

  it('navigates entries with the arrow keys and runs the focused one', async () => {
    const openChromePage = vi.fn(async () => {});
    const api: CommandPaletteApi = {
      query: '',
      openTab: vi.fn(async () => {}),
      switchToTab: vi.fn(async () => {}),
      openChromePage,
      toggleTheme: vi.fn(async () => {}),
      createNote: vi.fn(async () => {}),
      createTask: vi.fn(async () => {}),
      resetDashboardLayout: vi.fn(async () => {}),
    };
    const onRun = vi.fn(async (run: (api: CommandPaletteApi) => Promise<void>) => {
      await run(api);
    });
    renderPalette('', onRun);

    const input = screen.getByLabelText('Command query');
    await screen.findByText('Create a note');

    fireEvent.keyDown(input.parentElement as HTMLElement, { key: 'ArrowDown' });
    fireEvent.keyDown(input.parentElement as HTMLElement, { key: 'Enter' });

    expect(openChromePage).toHaveBeenCalledWith('chrome://downloads');
  });
});
