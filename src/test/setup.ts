import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom does not implement ResizeObserver.
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// jsdom does not implement matchMedia.
const mockMatchMedia = vi.fn(() => ({
  matches: false,
  media: '',
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}) as unknown as () => MediaQueryList);
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});
