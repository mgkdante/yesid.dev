/**
 * Locale-switch state handoff orchestrator (slice-34 foundation).
 *
 * A language switch (/about → /fr/about) changes the pathname, and
 * +layout.svelte wraps <main> in `{#key $page.url.pathname}`, so the WHOLE page
 * subtree unmounts and remounts — every in-memory rune is destroyed. This module
 * bridges the gap:
 *   - in `beforeNavigate` of a switch, it snapshots every registered session
 *     value (+ scroll + focus) into a versioned sessionStorage blob keyed by the
 *     delocalized path, and raises `restoring`;
 *   - in `afterNavigate` on the remounted page, it restores them AFTER paint,
 *     restores focus/selection by stable key (the old element is gone), clears
 *     the blob (switch-scoped), and lowers `restoring`.
 *
 * Wiring: call `attachLocaleHandoff()` at +layout.svelte SCRIPT INIT — not in
 * onMount's body — because beforeNavigate/afterNavigate must register during
 * component initialization. The root layout never remounts, so the orchestrator
 * (and its module state) survive page swaps.
 *
 * `persisted()` is the ergonomic consumer; pages with scroll register a
 * ScrollContext; async-mounted consumers (engine, Embla) read `pendingRestore`.
 */
import { browser } from '$app/environment';
import { beforeNavigate, afterNavigate } from '$app/navigation';
import { tick } from 'svelte';
import { delocalizePath, isLocaleSwitch } from '$lib/utils/locale-routing';
import {
	makeBlob,
	serializeBlob,
	parseBlob,
	type HandoffBlob,
	type FocusSnapshot,
} from './handoff-blob';

const STORAGE_PREFIX = 'yesid:lstate:';

export interface SessionEntry {
	get: () => unknown;
	set: (value: unknown) => void;
}

/** A page registers ONE scroll strategy; the orchestrator delegates capture/restore. */
export interface ScrollContext {
	capture: () => unknown;
	restore: (snapshot: unknown) => void | Promise<void>;
}

// --- module-scoped registries (populated client-side only) ---
const sessionRegistry = new Map<string, SessionEntry>();
let scrollContext: ScrollContext | null = null;

// The blob currently being restored. Async consumers (engine constructor, Embla
// onInit) read their value from here instead of racing `afterNavigate`.
let pendingBlob: HandoffBlob | null = null;

// Mask flag — surfaces that flash on restore (scroll, collapsibles) hold their
// region while this is true. Mutated client-side only; SSR always reads false.
let restoringState = $state(false);

export const localeHandoff = {
	get restoring() {
		return restoringState;
	},
};

// --- registration API ---
export function registerSession(key: string, entry: SessionEntry): () => void {
	sessionRegistry.set(key, entry);
	return () => {
		// only delete if this exact entry still owns the key (guards remount races)
		if (sessionRegistry.get(key) === entry) sessionRegistry.delete(key);
	};
}

export function registerScrollContext(ctx: ScrollContext): () => void {
	scrollContext = ctx;
	return () => {
		if (scrollContext === ctx) scrollContext = null;
	};
}

/** The value a consumer should seed itself with on this switch-restore, if any. */
export function pendingRestore(key: string): unknown {
	return pendingBlob?.entries[key];
}

// --- registry capture/apply (exported for unit tests) ---
export function captureEntries(): Record<string, unknown> {
	const entries: Record<string, unknown> = {};
	for (const [key, entry] of sessionRegistry) entries[key] = entry.get();
	return entries;
}

export function applyEntries(entries: Record<string, unknown>): void {
	for (const [key, value] of Object.entries(entries)) {
		sessionRegistry.get(key)?.set(value);
	}
}

// --- focus (the element dies on remount → re-derive by stable data-handoff-focus) ---
function captureFocus(): FocusSnapshot | null {
	const el = document.activeElement as HTMLElement | null;
	const key = el?.dataset?.handoffFocus;
	if (!key) return null;
	const field = el as HTMLInputElement | HTMLTextAreaElement;
	const start = typeof field.selectionStart === 'number' ? field.selectionStart : null;
	const end = typeof field.selectionEnd === 'number' ? field.selectionEnd : null;
	return { key, start, end };
}

function restoreFocus(focus: FocusSnapshot | null): void {
	if (!focus) return;
	const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
		`[data-handoff-focus="${CSS.escape(focus.key)}"]`,
	);
	if (!el) return;
	el.focus();
	if (focus.start != null && typeof el.setSelectionRange === 'function') {
		try {
			el.setSelectionRange(focus.start, focus.end ?? focus.start);
		} catch {
			/* non-text input — focus alone is enough */
		}
	}
}

// --- scroll (generic window offset by default; pages override via ScrollContext) ---
function captureScroll(): unknown {
	if (scrollContext) return scrollContext.capture();
	return { kind: 'offset', y: window.scrollY };
}

async function restoreScroll(snapshot: unknown): Promise<void> {
	if (scrollContext) {
		await scrollContext.restore(snapshot);
		return;
	}
	const y = (snapshot as { y?: number } | null)?.y ?? 0;
	window.scrollTo(0, y);
}

// --- storage (always guarded: private mode / quota must never crash a nav) ---
function storageKey(delocalized: string): string {
	return STORAGE_PREFIX + delocalized;
}

function writeBlob(blob: HandoffBlob): void {
	try {
		sessionStorage.setItem(storageKey(blob.path), serializeBlob(blob));
	} catch {
		/* private mode / quota — degrade to no-handoff */
	}
}

function readBlob(delocalized: string): HandoffBlob | null {
	try {
		return parseBlob(sessionStorage.getItem(storageKey(delocalized)), delocalized);
	} catch {
		return null;
	}
}

function clearBlob(delocalized: string): void {
	try {
		sessionStorage.removeItem(storageKey(delocalized));
	} catch {
		/* ignore */
	}
}

function nextFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function snapshot(delocalized: string, nowMs: number): void {
	writeBlob(
		makeBlob({
			path: delocalized,
			entries: captureEntries(),
			scroll: captureScroll(),
			focus: captureFocus(),
			ts: nowMs,
		}),
	);
}

// --- attach: wire the nav hooks (call at +layout INIT) ---
export function attachLocaleHandoff(): void {
	if (!browser) return;

	beforeNavigate((nav) => {
		if (!nav.from || !nav.to) return;
		if (!isLocaleSwitch(nav.from.url.pathname, nav.to.url.pathname)) return;
		// Idempotency: a rapid second switch fired mid-restore must NOT overwrite the
		// good blob with half-restored / default state — keep the in-flight one.
		if (restoringState) return;
		snapshot(delocalizePath(nav.from.url.pathname), Date.now());
		restoringState = true;
	});

	afterNavigate(async (nav) => {
		if (nav.type === 'enter') return; // initial hydration — nothing to restore
		if (!nav.from || !nav.to) return;
		if (!isLocaleSwitch(nav.from.url.pathname, nav.to.url.pathname)) {
			// A non-switch navigation cleared the in-flight restore — drop the flag so
			// the mask can never get stuck up after an aborted/redirected switch.
			if (restoringState) restoringState = false;
			return;
		}
		const delocalized = delocalizePath(nav.to.url.pathname);
		const blob = readBlob(delocalized);
		if (!blob) {
			restoringState = false;
			return;
		}
		pendingBlob = blob;
		// The {#key} subtree just remounted — wait for it to paint before we touch it.
		await tick();
		await nextFrame();
		await nextFrame();
		applyEntries(blob.entries);
		await restoreScroll(blob.scroll);
		restoreFocus(blob.focus);
		clearBlob(delocalized);
		pendingBlob = null;
		restoringState = false;
	});
}
