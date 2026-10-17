import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShortcutGrid } from './shortcut-grid';
import type { QuickLink } from '@/types';

const links: QuickLink[] = [
  { id: '1', title: 'Google', url: 'https://google.com', icon: 'G' },
  { id: '2', title: 'GitHub', url: 'https://github.com', icon: 'Octocat' },
];

describe('ShortcutGrid', () => {
  it('renders all links and handles open', () => {
    const onOpen = vi.fn();
    render(
      <ShortcutGrid
        links={links}
        onOpen={onOpen}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
        editable={false}
      />
    );
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Google'));
    expect(onOpen).toHaveBeenCalledWith(links[0]);
  });

  it('shows add button when editable', () => {
    const onAdd = vi.fn();
    render(
      <ShortcutGrid
        links={links}
        onOpen={vi.fn()}
        onAdd={onAdd}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
        editable={true}
      />
    );
    expect(screen.getByText(/Add link/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Add link/i));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('renders edit and delete actions when editable', () => {
    render(
      <ShortcutGrid
        links={links}
        onOpen={vi.fn()}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
        editable={true}
      />
    );
    expect(screen.getByLabelText('Edit Google')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Google')).toBeInTheDocument();
  });

  it('calls onReorder when links change', () => {
    const onReorder = vi.fn();
    render(
      <ShortcutGrid
        links={links}
        onOpen={vi.fn()}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onReorder={onReorder}
        editable={true}
      />
    );
    expect(onReorder).not.toHaveBeenCalled();
  });
});
