/**
 * Pure wire format for the locale-switch state handoff (slice-34).
 *
 * The orchestrator (locale-handoff.svelte.ts) captures a HandoffBlob in
 * `beforeNavigate` of a language switch and replays it in `afterNavigate` on
 * the remounted page. This module owns the serialization + the version/path
 * gate so a schema change — or a stale blob left by a prior deploy, or a blob
 * from a different page — is discarded instead of crashing a restore.
 *
 * No browser globals, no clock, no `$state` here — fully unit-testable. The
 * caller passes `ts` in.
 */

export const HANDOFF_BLOB_VERSION = 1;

export interface FocusSnapshot {
	/**
	 * Stable, locale-free field id (the `data-handoff-focus` attribute). The
	 * focused element is destroyed by the `{#key $page.url.pathname}` remount, so
	 * focus is re-derived by key after restore, never by element reference.
	 */
	key: string;
	start: number | null;
	end: number | null;
}

export interface HandoffBlob {
	v: number;
	/** Restore scope: delocalized path or stable translated-route identity. */
	path: string;
	/** Registered session values, keyed by `persisted()` key — locale-free primitives. */
	entries: Record<string, unknown>;
	/** Scroll snapshot — shape owned by the active scroll-context (offset/fraction/anchor). */
	scroll: unknown;
	focus: FocusSnapshot | null;
	/** Capture time in ms. Passed in by the caller — this module never reads the clock. */
	ts: number;
}

export function makeBlob(args: {
	path: string;
	entries: Record<string, unknown>;
	scroll: unknown;
	focus: FocusSnapshot | null;
	ts: number;
}): HandoffBlob {
	return { v: HANDOFF_BLOB_VERSION, ...args };
}

export function serializeBlob(blob: HandoffBlob): string {
	return JSON.stringify(blob);
}

/**
 * Parse + gate a stored blob. Returns null (discard) for malformed JSON, a
 * version mismatch, a scope mismatch (snapshot taken on a different page), or a
 * structurally invalid `entries` map.
 */
export function parseBlob(raw: string | null, expectedPath: string): HandoffBlob | null {
	if (!raw) return null;
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}
	if (!parsed || typeof parsed !== 'object') return null;
	const blob = parsed as Partial<HandoffBlob>;
	if (blob.v !== HANDOFF_BLOB_VERSION) return null;
	if (blob.path !== expectedPath) return null;
	if (typeof blob.entries !== 'object' || blob.entries === null) return null;
	return blob as HandoffBlob;
}
