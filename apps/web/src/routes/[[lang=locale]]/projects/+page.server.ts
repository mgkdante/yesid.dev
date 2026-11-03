import { localeFromParams } from '#lib/utils/locale-routing.ts';
// Service SVGs fetched via SvelteKit's `fetch` (works during SSR).

import { fetchServiceSvgContents } from '#lib/utils/service-svg.ts';
import { deriveProjectFacets } from '#lib/projects/project-facets.ts';
import { catalog } from '#lib/catalog/index.ts';
import { localeEntries } from '#lib/server/prerender-entries.ts';
import type { EntryGenerator } from './$types';

export const entries = (() => localeEntries('/projects')) satisfies EntryGenerator;
export const prerender = entries().length > 0;

export async function load({ fetch, params = {} }: { fetch: typeof globalThis.fetch; params?: { lang?: string } }) {
	const locale = localeFromParams(params);
	const [services, projects, projectsPage] = await Promise.all([
		catalog.services.available(locale),
		catalog.projects.available(locale),
		catalog.content.projectsPage(),
	]);
	const serviceSvgContents = await fetchServiceSvgContents(fetch, services);
	const { stackItems, serviceIds } = deriveProjectFacets(projects, locale);

	return { projects, stackItems, serviceIds, services, serviceSvgContents, projectsPage };
};
