import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WidgetGrid } from './widget-grid';

interface Widget {
  id: string;
  title: string;
  visible: boolean;
}

function setupWidgets(order: string[] = ['a', 'b']) {
  const widgets: Widget[] = order.map((id, _index) => ({
    id,
    title: `Widget ${id}`,
    visible: true,
  }));
  const onToggle = vi.fn();
  const onReorder = vi.fn();
  const onResetLayout = vi.fn();
  const utils = render(
    <WidgetGrid
      widgets={widgets}
      onToggle={onToggle}
      onReorder={onReorder}
      onResetLayout={onResetLayout}
    />
  );
  return { widgets, onToggle, onReorder, onResetLayout, ...utils };
}

describe('WidgetGrid', () => {
  it('lists every widget with its visibility', () => {
    setupWidgets();
    expect(screen.getByText('Widget a')).toBeInTheDocument();
    expect(screen.getByText('Widget b')).toBeInTheDocument();
    expect(screen.getAllByText('Visible')).toHaveLength(2);
  });

  it('toggles a widget visibility', () => {
    const { onToggle } = setupWidgets();
    const widgetA = screen.getByLabelText('Widget a: visible');
    fireEvent.click(within(widgetA).getByRole('button', { name: 'Hide' }));
    expect(onToggle).toHaveBeenCalledWith('a');
  });

  it('reorders widgets with the move buttons', () => {
    const { onReorder } = setupWidgets();

    // Move widget a down (swap with b)
    const moveDownButtons = screen.getAllByRole('button', {
      name: 'Move widget down',
    });
    fireEvent.click(moveDownButtons[0]);

    // Move widget b up (swap back with a)
    const moveUpButtons = screen.getAllByRole('button', {
      name: 'Move widget up',
    });
    fireEvent.click(moveUpButtons[1]);

    expect(onReorder).toHaveBeenCalledTimes(2);
  });

  it('moves the focused widget with the arrow up key', () => {
    const { onReorder } = setupWidgets();
    const grid = document.querySelector('.grid') as HTMLElement;

    fireEvent.keyDown(grid, { key: 'End' });
    fireEvent.keyDown(grid, { key: 'ArrowUp' });

    expect(onReorder).toHaveBeenCalledWith(['b', 'a']);
  });

  it('restores the default layout when asked', () => {
    const { onResetLayout } = setupWidgets();
    fireEvent.click(screen.getByRole('button', { name: /restore default/i }));
    expect(onResetLayout).toHaveBeenCalled();
  });
});
