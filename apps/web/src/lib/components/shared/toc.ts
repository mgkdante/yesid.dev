// Shared table-of-contents model + DOM helpers. ONE source for the project,
// services (and future blog) detail-page TOCs. The desktop nav (TocNav) and the
// mobile floating pill (TocPill) both consume this, so a card and its TOC entry
// always render the SAME badge (systematic, no ad-hoc per-page copies).

import type { SectionIconName } from './SectionIcon.svelte';

/** A TOC entry's leading mark. Mirrors the badge on the matching section card:
 *  a numbered card (`index`) -> number; an icon card -> the same SectionIcon shape. */
export type TocBadgeSpec =
	| { kind: 'number'; value: number }
	| { kind: 'icon'; name: SectionIconName };

export interface TocEntry {
	id: string;
	title: string;
	level: number;
	/** Leading badge; omitted for nested sub-headings (README h2/h3, etc.). */
	badge?: TocBadgeSpec;
	/** True for sections that live in the desktop SIDE RAIL (Stack / Services /
	 *  Links / Related). The desktop TocNav omits these (the rail already shows
	 *  them); the mobile TocPill keeps them (there they sit in the page flow). */
	rail?: boolean;
	children: TocEntry[];
}

/** Flatten entries + their children into one ordered list for the "N / total"
 *  counter and the active-entry lookup. */
export function flattenToc(entries: TocEntry[]): TocEntry[] {
	const flat: TocEntry[] = [];
	for (const entry of entries) {
		flat.push(entry);
		for (const child of entry.children) flat.push(child);
	}
	return flat;
}

/** Resolve a TOC id to its scroll-target element. Supports three anchor schemes
 *  so one resolver serves every detail page:
 *   - `section-N`            → the project article's locale-stable `[data-section-index="N"]`
 *   - `[data-toc="<id>"]`    → services sections; desktop+mobile dupes resolve to the first VISIBLE
 *   - plain element id       → README headings (`readme-h-N`) and anything else */
export function tocElement(id: string): Element | null {
	if (/^section-\d+$/.test(id)) {
		const el = document.querySelector(`[data-section-index="${id.slice('section-'.length)}"]`);
		if (el) return el;
	}
	const tagged = Array.from(document.querySelectorAll('[data-toc]')).filter(
		(el) => el.getAttribute('data-toc') === id,
	);
	if (tagged.length > 0) {
		const visible = tagged.find((el) => (el as HTMLElement).offsetParent !== null);
		return visible ?? tagged[0];
	}
	return document.getElementById(id);
}

/** Land the readable heading, including a closed card's visible trigger. */
export function navigateToc(id: string): void {
	const element = tocElement(id);
	if (!element) return;
	const closed = element.closest('[inert]');
	const card = closed?.closest('.section-card') ?? element;
	const target = card.querySelector<HTMLElement>('.section-header') ?? card;
	target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** New fragment requests land visibly; history keeps the router's saved offset. */
export function onTocNavigate({ type, to }: { type: string; to: { url: URL } | null }): void {
	let id = to?.url.hash.slice(1);
	if (!id || type === 'popstate') return;
	try {
		id = decodeURIComponent(id);
	} catch {
		return;
	}
	navigateToc(id);
}

/** Observe every TOC-target element on the page and report the active id as the
 *  user scrolls. One observer drives BOTH the desktop nav and the mobile pill
 *  (the page owns the active id and passes it down; no duplicate observers).
 *  Returns a cleanup fn for onMount. */
export function observeActiveToc(setActive: (id: string) => void): () => void {
	const els = document.querySelectorAll(
		'[data-section-index], [id^="readme-h-"], [data-toc], [data-testid="blog-section-body"] h3[id], [data-testid="blog-section-body"] h4[id]',
	);
	if (els.length === 0) return () => {};

	let fragmentFrame = 0;
	let fragmentHref = '';
	const content = els[0].closest('main') ?? document;
	const cancelFragment = () => {
		cancelAnimationFrame(fragmentFrame);
		fragmentHref = '';
	};
	const onHistory = (event: PopStateEvent) => {
		// A new native hash entry has null state. Router history can revisit
		// the same URL at another reading position and must cancel the pending jump.
		if (event.state !== null || location.href !== fragmentHref) cancelFragment();
	};
	function onHashLink(event: MouseEvent) {
		if (
			event.defaultPrevented ||
			event.button ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		)
			return;
		const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
		if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
		const url = new URL(link.href);
		if (
			!url.hash ||
			url.origin !== location.origin ||
			url.pathname !== location.pathname ||
			url.search !== location.search
		)
			return;
		cancelAnimationFrame(fragmentFrame);
		fragmentHref = url.href;
		// Same-document hashes bypass SvelteKit's afterNavigate hook. Let its
		// history/default action finish, then correct only this requested landing.
		fragmentFrame = requestAnimationFrame(() => {
			if (location.href === url.href) onTocNavigate({ type: 'link', to: { url } });
		});
	}
	// Main sees content cancellations before SvelteKit intercepts at the app root.
	content.addEventListener('click', onHashLink as EventListener);
	document.addEventListener('click', cancelFragment, true);
	window.addEventListener('popstate', onHistory);

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				const el = entry.target as HTMLElement;
				const sectionIdx = el.getAttribute('data-section-index');
				const dataToc = el.getAttribute('data-toc');
				if (sectionIdx !== null) setActive(`section-${sectionIdx}`);
				else if (dataToc) setActive(dataToc);
				else if (el.id) setActive(el.id);
			}
		},
		{ rootMargin: '-20% 0px -70% 0px' },
	);
	els.forEach((el) => observer.observe(el));
	return () => {
		observer.disconnect();
		content.removeEventListener('click', onHashLink as EventListener);
		document.removeEventListener('click', cancelFragment, true);
		window.removeEventListener('popstate', onHistory);
		cancelFragment();
	};
}
