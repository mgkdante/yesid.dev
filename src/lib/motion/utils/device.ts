/**
 * Detect touch device via the Pointer Events spec.
 * Uses maxTouchPoints (reliable, not spoofed by jsdom).
 */
export function isTouchDevice(): boolean {
	return typeof window !== 'undefined' && navigator.maxTouchPoints > 0;
}
