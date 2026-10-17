import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'default' | 'destructive' | 'success';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners: Set<Listener> = new Set();

function emit(): void {
  const snapshot = toasts;
  listeners.forEach((listener) => listener(snapshot));
}

/**
 * Display a toast notification. Returns the toast id so it can be dismissed
 * programmatically.
 */
export function toast(options: Omit<Toast, 'id'>): string {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  const item: Toast = { id, duration: 4000, ...options };
  toasts = [...toasts, item];
  emit();
  if ((item.duration ?? 0) > 0) {
    setTimeout(() => {
      dismiss(id);
    }, item.duration);
  }
  return id;
}

export function dismiss(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function dismissAll(): void {
  toasts = [];
  emit();
}

export const ToastContext = createContext<{
  toasts: Toast[];
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>;
} | null>(null);

/**
 * Access the current toasts inside a <Toaster> subtree.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a <Toaster>');
  }
  return context;
}

/**
 * Provides toast state and renders the toast anchor. Place once per page,
 * typically inside the shared shell layout.
 */
export function Toaster({ children }: { children: ReactNode }) {
  const [localToasts, setLocalToasts] = useState<Toast[]>(toasts);

  useEffect(() => {
    const listener: Listener = (snapshot) => setLocalToasts(snapshot);
    listeners.add(listener);
    emit();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts: localToasts, setToasts: setLocalToasts }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {localToasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const { title, description } = toast;
  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg',
        toast.variant === 'destructive' ? 'border-destructive' : 'border-input'
      )}
    >
      <div className="flex flex-col gap-1">
        {title && <h3 className="text-sm font-semibold">{title}</h3>}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
