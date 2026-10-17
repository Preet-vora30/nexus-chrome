/**
 * To-do list service.
 *
 * Tasks are persisted in `chrome.storage.local` through the shared storage
 * layer. Supports priorities, due dates, categories, and filters. Reads
 * sanitize the stored shape so corrupted entries never break the UI.
 */

import { storage } from './storage';
import type { TaskPriority, TodoItem } from '@/types';

export type TaskFilter = 'all' | 'active' | 'completed';

export interface TaskDraft {
  title: string;
  priority: TaskPriority;
  dueDate?: string;
  category?: string;
}

const TASKS_KEY = 'nexus_tasks';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sanitizePriority(value: unknown): TaskPriority {
  return value === 'low' || value === 'medium' || value === 'high'
    ? value
    : 'none';
}

function sanitizeDate(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return value;
}

function sanitizeCategory(value: unknown): string | undefined {
  const raw = value;
  return typeof raw === 'string' && raw.length > 0 ? raw.slice(0, 80) : undefined;
}

function sanitizeTodo(value: unknown, index: number): TodoItem | null {
  if (!isRecord(value)) return null;
  const id =
    typeof value['id'] === 'string' && value['id'].length > 0
      ? value['id']
      : `task-${index}-${Date.now()}`;
  const title = typeof value['title'] === 'string' ? value['title'] : undefined;
  if (!title) return null;
  const done = value['done'] === true;
  const doneAt =
    done && typeof value['doneAt'] === 'number' && Number.isFinite(value['doneAt'])
      ? value['doneAt']
      : undefined;
  const createdAt =
    typeof value['createdAt'] === 'number' && Number.isFinite(value['createdAt'])
      ? value['createdAt']
      : Date.now();
  return {
    id,
    title,
    done,
    doneAt,
    priority: sanitizePriority(value['priority']),
    dueDate: sanitizeDate(value['dueDate']),
    category: sanitizeCategory(value['category']),
    createdAt,
  };
}

export interface TaskProgress {
  total: number;
  completed: number;
  active: number;
}

export function getProgress(tasks: TodoItem[]): TaskProgress {
  let completed = 0;
  let active = 0;
  for (const task of tasks) {
    if (task.done) completed += 1;
    else active += 1;
  }
  return { total: tasks.length, completed, active };
}

/** Sort tasks: active tasks first (newest first), then completed ones. */
export function sortTasks(tasks: TodoItem[]): TodoItem[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}

/** List tasks in the requested filter, most recent first within each group. */
export function filterTasks(tasks: TodoItem[], filter: TaskFilter): TodoItem[] {
  if (filter === 'active') return tasks.filter((task) => !task.done);
  if (filter === 'completed') return tasks.filter((task) => task.done);
  return tasks;
}

/** List all tasks. */
export async function listTasks(): Promise<TodoItem[]> {
  const raw = await storage.get<unknown>(TASKS_KEY, []);
  if (!Array.isArray(raw)) return [];
  const tasks = raw
    .map((item, index) => sanitizeTodo(item, index))
    .filter((task): task is TodoItem => task !== null);
  return sortTasks(tasks);
}

/** Persist the full list of tasks. */
export async function saveTasks(tasks: TodoItem[]): Promise<void> {
  const clean = tasks.map((task, index) => sanitizeTodo(task, index));
  await storage.set(TASKS_KEY, clean);
}

export async function createTask(draft: TaskDraft): Promise<TodoItem> {
  const now = Date.now();
  const task: TodoItem = {
    id: crypto.randomUUID(),
    title: draft.title.trim() || 'Untitled task',
    done: false,
    priority: draft.priority,
    dueDate: draft.dueDate,
    category: draft.category,
    createdAt: now,
  };
  const tasks = await listTasks();
  tasks.unshift(task);
  await saveTasks(tasks);
  return task;
}

/** Mark a task complete (or reopen an already completed one). */
export async function setTaskDone(
  id: string,
  done: boolean
): Promise<TodoItem | null> {
  const tasks = await listTasks();
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) return null;
  const current = tasks[index];
  const updated: TodoItem = {
    ...current,
    done,
    doneAt: done ? Date.now() : undefined,
  };
  tasks[index] = updated;
  await saveTasks(tasks);
  return updated;
}

/** Update editable fields of a task (priority, due date, category). */
export async function updateTask(
  id: string,
  patch: Partial<Omit<TaskDraft, 'title'>>
): Promise<TodoItem | null> {
  const tasks = await listTasks();
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) return null;
  const current = tasks[index];
  const updated: TodoItem = {
    ...current,
    priority: patch.priority ?? current.priority,
    dueDate: patch.dueDate,
    category: patch.category,
  };
  await saveTasks(tasks);
  return updated;
}

export async function removeTask(id: string): Promise<void> {
  const tasks = await listTasks();
  await saveTasks(tasks.filter((task) => task.id !== id));
}
