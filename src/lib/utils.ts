import { clsx, type ClassValue } from 'clsx';

/**
 * Utility for composing class names. Wraps `clsx` so component libraries
 * (e.g. class-variance-authority) can be extended without touching this file.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
