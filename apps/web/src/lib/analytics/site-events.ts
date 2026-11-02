import { siteMeta } from '#lib/content/index.ts';
import { pathLocale } from '#lib/utils/locale-routing.ts';
import type { AnalyticsEventName } from './preset';

function profileKey(href: string): string | null {
	try {
		const url = new URL(href);
		return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
	} catch {
		return null;
	}
}

const PROFILE_KEYS = new Set(
	[siteMeta.links.github, siteMeta.links.linkedin, siteMeta.links.upwork].flatMap((href) => {
		const key = href ? profileKey(href) : null;
		return key ? [key] : [];
	}),
);

interface NavigationEnds {
	readonly from: { readonly url: URL } | null;
	readonly to: { readonly url: URL } | null;
}

/** Events implied by a finished navigation: a 404 render, or a hop between locales. */
export function navigationEvents(navigation: NavigationEnds, status: number): AnalyticsEventName[] {
	const events: AnalyticsEventName[] = [];
	if (status === 404) events.push('404');
	const from = navigation.from?.url.pathname;
	const to = navigation.to?.url.pathname;
	if (from && to && pathLocale(from) !== pathLocale(to)) events.push('language_switch');
	return events;
}

/** True when the click lands on a link to one of the owner's GitHub, LinkedIn or Upwork profiles. */
export function isProfileClick(event: Pick<MouseEvent, 'target'>): boolean {
	const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
	const key = anchor instanceof HTMLAnchorElement ? profileKey(anchor.href) : null;
	return key !== null && PROFILE_KEYS.has(key);
}
