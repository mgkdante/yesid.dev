import type { Locale } from '$lib/types';
import { buildBreadcrumbListNode, buildCollectionPageNode } from './jsonld';
import { resolveLocale } from '$lib/utils/locale';
import { resolveSitePage } from '$lib/utils/page-registry';
import { canonicalFor } from '$lib/utils/seo-defaults';

export type RouteCrumb = readonly [path: string, fallback: string, name?: string];

function crumbName(path: string, locale: Locale, fallback: string): string {
	const page = resolveSitePage(path);
	return page ? resolveLocale(page.title, locale) : fallback;
}

export function buildRouteBreadcrumbNode(
	routePath: string,
	locale: Locale,
	descendants: readonly RouteCrumb[],
) {
	const crumbs: readonly RouteCrumb[] = [['/', 'Home'], ...descendants];
	return buildBreadcrumbListNode(
		crumbs.map(([path, fallback, name]) => ({
			name: name ?? crumbName(path, locale, fallback),
			url: canonicalFor(path, locale),
		})),
		canonicalFor(routePath, locale),
	);
}

export function buildCollectionRouteNodes(args: {
	path: string;
	locale: Locale;
	nameFallback: string;
	description: string;
	crumbs?: readonly RouteCrumb[];
}) {
	const canonicalUrl = canonicalFor(args.path, args.locale);
	const crumbs = args.crumbs ?? [[args.path, args.nameFallback] as const];
	return [
		buildCollectionPageNode({
			name: crumbName(args.path, args.locale, args.nameFallback),
			description: args.description,
			url: canonicalUrl,
		}),
		buildRouteBreadcrumbNode(args.path, args.locale, crumbs),
	];
}
