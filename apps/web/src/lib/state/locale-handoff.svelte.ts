/* Register locale handoff during layout initialization; navigation hooks cannot register inside onMount. */
import { browser } from '$app/env';
import { beforeNavigate, afterNavigate } from '$app/navigation';
import { tick } from 'svelte';
import { delocalizePath, isLocaleSwitch, pathLocale } from '#lib/utils/locale-routing.ts';
import { getLenis } from '@yesid/motion/utils/lenis';
import {
	makeBlob,
	serializeBlob,
	parseBlob,
	type HandoffBlob,
	type FocusSnapshot,
} from './handoff-blob';

const STORAGE_PREFIX = 'yesid:lstate:';

/** A page registers ONE scroll strategy; the orchestrator delegates capture/restore. */
export interface ScrollContext {
	capture: () => unknown;
	restore: (snapshot: unknown) => void | Promise<void>;
}

let scrollContext: ScrollContext | null = null;
let activeSwitchKey: string | null = null;
let activeStableIdentity: string | null = null;

// Mask flag — surfaces that flash on restore (scroll) hold their
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

export function registerScrollContext(ctx: ScrollContext): () => void {
	scrollContext = ctx;
	return () => {
		if (scrollContext === ctx) scrollContext = null;
	};
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
		if (nav.shallow && nav.type === 'goto') return;

		if (!nav.from || !nav.to) return;
		// Idempotency: a rapid second switch fired mid-restore must NOT overwrite the
		// good blob with half-restored / default state — keep the in-flight one.
		if (restoringState) return;
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
		if (nav.shallow && nav.type === 'goto') return;
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
		// The {#key} subtree just remounted — wait for it to paint before we touch it.
		await tick();
		await nextFrame();
		await nextFrame();
		await restoreScroll(blob.scroll);
		restoreFocus(blob.focus);
		clearBlob(scope);
		activeSwitchKey = null;
		activeStableIdentity = null;
		restoringState = false;
	});
}
