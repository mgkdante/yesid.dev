/* Register locale handoff during layout initialization; navigation hooks cannot register inside onMount. */
import { browser } from '$app/env';
import { beforeNavigate, afterNavigate } from '$app/navigation';
import { onMount, tick } from 'svelte';
import { delocalizePath, isLocaleSwitch, pathLocale } from '#lib/utils/locale-routing.ts';
import { getLenis } from '@yesid/motion/utils/lenis';
import type { FocusSnapshot } from './handoff-blob';
import { createReadingSession, type NavigationIntent, type ScrollContext, type SessionPorts } from './reading-session';
export type { ScrollContext } from './reading-session';

let stableIdentity: () => string | undefined = () => undefined;

/** Preserve activation before Kit repaints and resolves navigation intent. */
export function getNavigationCaptureY(): number | undefined { return session.departureY(); }

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
	return session.register(ctx);
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

function nextFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

const history: SessionPorts['history'] = {
	suppressAnchoring: () => {
		const root = document.documentElement;
		const previous = root.style.overflowAnchor;
		root.style.overflowAnchor = 'none';
		return () => { root.style.overflowAnchor = previous; };
	},
	pendingDiagrams: () => Boolean(document.querySelector('.mermaid-diagram[data-rendering="true"]')),
	onLayoutChange: (cb) => {
		const observer = new MutationObserver(cb);
		observer.observe(document.body, {
			subtree: true, childList: true, attributes: true, attributeFilter: ['data-rendering'],
		});
		return () => observer.disconnect();
	},
	onReaderInput: (cb) => {
		const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
		for (const event of events) window.addEventListener(event, cb, { capture: true, passive: true });
		return () => { for (const event of events) window.removeEventListener(event, cb, true); };
	},
	frame: (cb) => {
		const id = requestAnimationFrame(cb);
		return () => cancelAnimationFrame(id);
	},
};

const session = createReadingSession({
	history,
	scrollY: () => window.scrollY,
	scrollTo: lenisAwareScrollTo,
	store: {
		get: (key) => sessionStorage.getItem(key),
		set: (key, value) => sessionStorage.setItem(key, value),
		remove: (key) => sessionStorage.removeItem(key),
	},
	focus: { capture: captureFocus, restore: restoreFocus },
	afterPaint: async () => { await tick(); await nextFrame(); await nextFrame(); },
	now: () => Date.now(),
	stableIdentity: () => stableIdentity(),
	setRestoring: (value) => { restoringState = value; },
	routing: { key: localeHandoffKey, isHandoff: isLocaleHandoffNavigation, isSwitch: isLocaleSwitch },
});

type KitIntent = {
	type: string;
	from: { url: URL } | null;
	to: { url: URL } | null;
	shallow: boolean;
	willUnload?: boolean;
	complete?: Promise<unknown>;
};
function navigationIntent(nav: KitIntent): NavigationIntent {
	return { type: nav.type, fromPath: nav.from?.url.pathname, toPath: nav.to?.url.pathname,
		shallow: nav.shallow, willUnload: nav.willUnload ?? false,
		event: 'event' in nav && nav.event instanceof Event ? nav.event : undefined,
		complete: nav.complete };
}

// Register during layout initialization; hooks cannot register inside onMount.
export function attachLocaleHandoff(getStableIdentity: () => string | undefined = () => undefined): void {
	if (!browser) return;
	stableIdentity = getStableIdentity;
	onMount(() => {
		const capture = (event: MouseEvent) => session.activate(event);
		window.addEventListener('click', capture, true);
		return () => {
			window.removeEventListener('click', capture, true);
			session.dispose();
		};
	});
	beforeNavigate((nav) => session.before(navigationIntent(nav)));
	afterNavigate((nav) => session.after(navigationIntent(nav)));
}
