import { siteMeta } from '#lib/content/index.ts';
import { pathLocale } from '#lib/utils/locale-routing.ts';
import type { AnalyticsEventName } from './preset';

type ProfileNetwork = 'github' | 'linkedin' | 'upwork';

function profileKey(href: string): string | null {
	try {
		const url = new URL(href);
		return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
	} catch {
		return null;
	}
}

const PROFILE_NETWORKS = new Map<string, ProfileNetwork>(
	(['github', 'linkedin', 'upwork'] as const).flatMap((network) => {
		const href = siteMeta.links[network];
		const key = href ? profileKey(href) : null;
		return key ? [[key, network] as const] : [];
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

/** The owner profile (GitHub, LinkedIn or Upwork) a click lands on, or null for any other target. */
export function profileClickNetwork(event: Pick<MouseEvent, 'target'>): ProfileNetwork | null {
	const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
	const key = anchor instanceof HTMLAnchorElement ? profileKey(anchor.href) : null;
	return key === null ? null : (PROFILE_NETWORKS.get(key) ?? null);
}
