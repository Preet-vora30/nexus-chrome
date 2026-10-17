import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTask,
  filterTasks,
  getProgress,
  listTasks,
  removeTask,
  saveTasks,
  setTaskDone,
  sortTasks,
  updateTask,
} from './todos';
import type { TodoItem } from '@/types';

const originalChrome = globalThis.chrome;

beforeEach(() => {
  // Fall back to the localStorage storage so tests stay deterministic.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = undefined;
  localStorage.clear();
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = originalChrome;
});

function buildTask(partial: Partial<TodoItem> & { id: string }): TodoItem {
  return {
    title: partial.title ?? 'Task',
    done: partial.done ?? false,
    doneAt: partial.doneAt,
    priority: partial.priority ?? 'none',
    dueDate: partial.dueDate,
    category: partial.category,
    createdAt: partial.createdAt ?? Date.now(),
    id: partial.id,
  };
}

describe('todos service', () => {
  it('creates and lists tasks', async () => {
    const task = await createTask({ title: 'Write tests', priority: 'high' });

    const listed = await listTasks();
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe(task.id);
    expect(listed[0].title).toBe('Write tests');
    expect(listed[0].priority).toBe('high');
    expect(listed[0].done).toBe(false);
  });

  it('persists status changes', async () => {
    const task = await createTask({ title: 'Task', priority: 'none' });
    const done = await setTaskDone(task.id, true);

    expect(done?.done).toBe(true);
    const listed = await listTasks();
    expect(listed[0].done).toBe(true);
    expect(listed[0].doneAt).not.toBeUndefined();
  });

  it('reopens a completed task', async () => {
    const task = await createTask({ title: 'Task', priority: 'none' });
    await setTaskDone(task.id, true);
    const reopened = await setTaskDone(task.id, false);

    expect(reopened?.done).toBe(false);
    expect(reopened?.doneAt).toBeUndefined();
  });

  it('updates editable fields', async () => {
    const task = await createTask({
      title: 'Task',
      priority: 'none',
      dueDate: '2026-10-01',
    });
    const updated = await updateTask(task.id, {
      priority: 'low',
      dueDate: '2026-10-31',
      category: 'Work',
    });

    expect(updated?.priority).toBe('low');
    expect(updated?.dueDate).toBe('2026-10-31');
    expect(updated?.category).toBe('Work');
  });

  it('removes a task', async () => {
    const task = await createTask({ title: 'Task', priority: 'none' });
    await removeTask(task.id);

    expect(await listTasks()).toHaveLength(0);
  });

  it('computes progress', () => {
    const tasks = [
      buildTask({ id: '1', done: true, createdAt: 1 }),
      buildTask({ id: '2', done: false, createdAt: 2 }),
    ];
    expect(getProgress(tasks)).toEqual({ total: 2, completed: 1, active: 1 });
  });

  it('filters active and completed tasks', () => {
    const active = buildTask({ id: '1', done: false, createdAt: 1 });
    const done = buildTask({ id: '2', done: true, createdAt: 2 });

    expect(filterTasks([done, active], 'active')).toEqual([active]);
    expect(filterTasks([done, active], 'completed')).toEqual([done]);
    expect(filterTasks([done, active], 'all')).toHaveLength(2);
  });

  it('sorts completed tasks after active ones', () => {
    const done = buildTask({ id: '1', done: true, createdAt: 1 });
    const active = buildTask({ id: '2', done: false, createdAt: 2 });

    const sorted = sortTasks([done, active]);
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('1');
  });

  it('drops invalid stored entries on read', async () => {
    await saveTasks([
      buildTask({ id: 'ok', title: 'Valid', createdAt: 1 }),
      { id: 'broken', title: 42 } as unknown as TodoItem,
    ]);

    const listed = await listTasks();
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe('ok');
  });
});
