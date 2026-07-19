/**
 * Locale-switch state handoff orchestrator (slice-34 foundation).
 *
 * A language switch (/about → /fr/about) changes the pathname, and
 * +layout.svelte wraps <main> in `{#key $page.url.pathname}`, so the WHOLE page
 * subtree unmounts and remounts — every in-memory rune is destroyed. This module
 * bridges the gap:
 *   - in `beforeNavigate` of a switch, it snapshots every registered session
 *     value (+ scroll + focus) into a versioned sessionStorage blob keyed by the
 *     delocalized path (or a stable translation-group identity), and raises
 *     `restoring`;
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
import { delocalizePath, isLocaleSwitch, pathLocale } from '$lib/utils/locale-routing';
import { getLenis } from '@yesid/motion/utils/lenis';
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
let activeSwitchKey: string | null = null;
let activeStableIdentity: string | null = null;

// Mask flag — surfaces that flash on restore (scroll, collapsibles) hold their
// region while this is true. Mutated client-side only; SSR always reads false.
let restoringState = $state(false);

export const localeHandoff = {
	get restoring() {
		return restoringState;
	},
};

function normalizedIdentity(identity: string | undefined): string | undefined {
	const normalized = identity?.trim();
	return normalized || undefined;
}

/** Storage/restore scope for a page. Translated slugs share the stable identity. */
export function localeHandoffKey(pathname: string, stableIdentity?: string): string {
	const identity = normalizedIdentity(stableIdentity);
	return identity ? `id:${identity}` : delocalizePath(pathname);
}

/** Before-navigation gate, including translated routes whose slugs differ by locale. */
export function isLocaleHandoffNavigation(
	fromPathname: string,
	toPathname: string,
	stableIdentity?: string,
): boolean {
	if (pathLocale(fromPathname) === pathLocale(toPathname)) return false;
	return isLocaleSwitch(fromPathname, toPathname) || Boolean(normalizedIdentity(stableIdentity));
}

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

/**
 * Synchronously read a consumer's restored value DURING a switch so it can
 * initialize directly in its restored state at construction — no
 * default-then-restore flash (e.g. a collapsible that would otherwise render open
 * for a frame then visibly animate shut). Prefers the in-memory blob (set by
 * afterNavigate for late async mounts), else reads the sessionStorage blob written
 * in beforeNavigate, which is still present for the duration of the remount. Gated
 * on `restoringState` so it never returns stale data outside an active restore
 * (a normal mount or a plain reload reads nothing → consumer keeps its default).
 */
export function peekRestore(key: string): unknown {
	if (!browser) return undefined;
	if (pendingBlob) return pendingBlob.entries[key];
	if (!restoringState) return undefined;
	try {
		const scope = activeSwitchKey ?? delocalizePath(window.location.pathname);
		return parseBlob(sessionStorage.getItem(storageKey(scope)), scope)?.entries[key];
	} catch {
		return undefined;
	}
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
// Lenis is the site-wide scroll engine (apps/web/+layout.svelte initLenis), so
// EVERY default restore must be Lenis-aware. window.scrollTo() fights an active
// Lenis: Lenis keeps its own animated position and snaps the page back. When a
// Lenis instance is live we use its jumpTo recipe (HeroBanner's): resize() to
// sync the cached scroll limits to the freshly-remounted page height, then an
// immediate forced scrollTo. On touch / reduced-motion (no Lenis) we fall back
// to the native window.scrollTo.
function captureScroll(): unknown {
	if (scrollContext) return scrollContext.capture();
	return { kind: 'offset', y: window.scrollY };
}

/**
 * Lenis-aware instant scroll to `y`. Mirrors HeroBanner.jumpTo — resize() first
 * so Lenis's debounced dimension cache matches the just-remounted page before we
 * target a position past the old (shorter/taller) limit, then an immediate forced
 * scroll so no easing animation plays. Shared by the default restore AND the
 * page-level ScrollContexts (home pin-fraction, prose heading) so all scroll
 * restore goes through one Lenis-safe path.
 */
export function lenisAwareScrollTo(y: number): void {
	const lenis = getLenis();
	if (lenis) {
		lenis.resize();
		lenis.scrollTo(y, { immediate: true, force: true });
	} else {
		window.scrollTo(0, y);
	}
}

async function restoreScroll(snapshot: unknown): Promise<void> {
	if (scrollContext) {
		await scrollContext.restore(snapshot);
		return;
	}
	const y = (snapshot as { y?: number } | null)?.y ?? 0;
	lenisAwareScrollTo(y);
}

// --- storage (always guarded: private mode / quota must never crash a nav) ---
function storageKey(scope: string): string {
	return STORAGE_PREFIX + scope;
}

function writeBlob(blob: HandoffBlob): void {
	try {
		sessionStorage.setItem(storageKey(blob.path), serializeBlob(blob));
	} catch {
		/* private mode / quota — degrade to no-handoff */
	}
}

function readBlob(scope: string): HandoffBlob | null {
	try {
		return parseBlob(sessionStorage.getItem(storageKey(scope)), scope);
	} catch {
		return null;
	}
}

function clearBlob(scope: string): void {
	try {
		sessionStorage.removeItem(storageKey(scope));
	} catch {
		/* ignore */
	}
}

function nextFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function snapshot(scope: string, nowMs: number): void {
	writeBlob(
		makeBlob({
			path: scope,
			entries: captureEntries(),
			scroll: captureScroll(),
			focus: captureFocus(),
			ts: nowMs,
		}),
	);
}

// --- attach: wire the nav hooks (call at +layout INIT) ---
export function attachLocaleHandoff(getStableIdentity: () => string | undefined = () => undefined): void {
	if (!browser) return;

	beforeNavigate((nav) => {
		// Any navigation ends the previous page's pending async restore — clear it so
		// a slow async consumer (e.g. the dynamically-imported stack-engine) that
		// already read it on THIS page cannot be re-seeded with stale data on a later
		// page. The blob is consumed for the lifetime of the page it was restored on.
		if (!nav.from || !nav.to) return;
		// Idempotency: a rapid second switch fired mid-restore must NOT overwrite the
		// good blob with half-restored / default state — keep the in-flight one.
		if (restoringState) return;
		pendingBlob = null;
		activeSwitchKey = null;
		activeStableIdentity = null;
		const stableIdentity = normalizedIdentity(getStableIdentity());
		if (
			!isLocaleHandoffNavigation(
				nav.from.url.pathname,
				nav.to.url.pathname,
				stableIdentity,
			)
		) return;
		activeSwitchKey = localeHandoffKey(nav.from.url.pathname, stableIdentity);
		activeStableIdentity = stableIdentity ?? null;
		snapshot(activeSwitchKey, Date.now());
		restoringState = true;
	});

	afterNavigate(async (nav) => {
		if (nav.type === 'enter') return; // initial hydration — nothing to restore
		if (!nav.from || !nav.to) return;
		if (!activeSwitchKey && !isLocaleSwitch(nav.from.url.pathname, nav.to.url.pathname)) {
			// A non-switch navigation cleared the in-flight restore — drop the flag so
			// the mask can never get stuck up after an aborted/redirected switch.
			if (restoringState) restoringState = false;
			return;
		}
		const scope = activeSwitchKey ?? localeHandoffKey(nav.to.url.pathname);
		if (
			activeStableIdentity &&
			normalizedIdentity(getStableIdentity()) !== activeStableIdentity
		) {
			clearBlob(scope);
			activeSwitchKey = null;
			activeStableIdentity = null;
			restoringState = false;
			return;
		}
		const blob = readBlob(scope);
		if (!blob) {
			activeSwitchKey = null;
			activeStableIdentity = null;
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
		clearBlob(scope);
		activeSwitchKey = null;
		activeStableIdentity = null;
		// Keep `pendingBlob` in memory (NOT cleared here). Async-mounted consumers —
		// e.g. the stack-engine, which loads via dynamic import() and constructs AFTER
		// this restore window — read their seed from pendingRestore() during the rest
		// of the page's life. It is cleared on the next beforeNavigate (above).
		restoringState = false;
	});
}
