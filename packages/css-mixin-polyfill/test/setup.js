// Test setup

/* global document */

import { vi } from 'vitest';

// Mock CSS.supports for testing
globalThis.CSS = {
	supports: vi.fn().mockReturnValue(false)
};

// Mock window.matchMedia
Object.defineProperty(globalThis, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock document.styleSheets
Object.defineProperty(document, 'styleSheets', {
	writable: true,
	value: []
});
