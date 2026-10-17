import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QuickAccess } from './quick-access';
import { createNote } from '@/lib/notes';
import { createTask } from '@/lib/todos';

const originalChrome = globalThis.chrome;

beforeEach(() => {
  localStorage.clear();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = undefined;
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = originalChrome;
});

describe('QuickAccess', () => {
  it('renders the shared shortcuts for the popup and side panel', async () => {
    await createNote({ title: 'Shared note', content: '' });
    await createTask({ title: 'Shared task', priority: 'none' });

    render(<QuickAccess />);

    expect(screen.getByRole('button', { name: /Dashboard/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Settings/ })).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Toggle theme (currently dark)',
      })
    ).toBeInTheDocument();
  });

  it('counts notes and open tasks from the shared storage', async () => {
    await createNote({ title: 'Shared note', content: '' });
    await createTask({ title: 'Shared task', priority: 'none' });

    render(<QuickAccess />);

    // Wait for the async storage reads to update the counts.
    await act(async () => {
      await Promise.resolve();
    });

    const strong = Array.from(document.querySelectorAll('strong')).map(
      (node) => node.textContent
    );
    expect(strong[0]).toBe('1'); // notes
    expect(strong[1]).toBe('1'); // open tasks
  });

  it('toggles the theme through the shared theme storage', async () => {
    render(<QuickAccess />);

    const toggle = screen.getByRole('button', {
      name: 'Toggle theme (currently dark)',
    });
    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(
      screen.getByRole('button', { name: 'Toggle theme (currently system)' })
    ).toBeInTheDocument();
  });
});
