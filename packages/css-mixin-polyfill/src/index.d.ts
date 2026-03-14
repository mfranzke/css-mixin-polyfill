export { buildTimeTransform } from './transform.js';

/**
 * Initialize the polyfill
 */
export function init(options?: Record<string, unknown>): void;

/**
 * Process CSS text containing @mixin/@macro/@apply rules
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function processCSSText(
	cssText: string,
	options?: Record<string, unknown>
): string;

/**
 * Check if browser has native CSS @mixin/@macro support
 */
export function hasNativeSupport(): boolean;

/**
 * Public API to manually trigger processing
 */
export function refresh(): void;
