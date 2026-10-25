// Project detail page loader — server-only so hydration reuses __data.json
// instead of re-running the load in the browser (reads resolve from the
// static content layer post-27.2).

import { error } from '@sveltejs/kit';
import { renderGithubReadme } from '#lib/server/markdown.js';
import { fetchServiceSvgContents } from '#lib/utils/index.js';
import { resolveLocale } from '#lib/utils/locale.js';
import { localeFromParams } from '#lib/utils/locale-routing.js';
import { adapter } from '#lib/adapters/index.js';
import { projectEntries } from '#lib/server/prerender-entries.js';
import { collectCodeHighlights } from '#lib/server/code-highlights.js';
import type { Service } from '#lib/types.js';

export const entries = projectEntries;
export const prerender = entries().length > 0;

export async function load({ params, fetch, url }: { params: { slug: string; lang?: string }; fetch: typeof globalThis.fetch; url: URL }) {
	const project = await adapter.projects.bySlug(params.slug);

	if (!project || project.status === 'private') {
		error(404, { message: 'Project not found' });
	}

	const servicesResolved = await Promise.all(
		project.relatedServices.map((id) => adapter.services.byId(id)),
	);
	const services: Service[] = servicesResolved.filter(
		(s): s is Service => s !== undefined,
	);

	// Resolved from the build-time glob in fetchServiceSvgContents — a runtime
	// self-fetch of /svg/services/* 401s on auth-protected Vercel previews.
	const serviceSvgContents = await fetchServiceSvgContents(fetch, services);

	const readmeHtml = await renderGithubReadme(project.readmeUrl, fetch);

	// Shiki runs server-side only. Highlight exactly the docs THIS URL renders:
	// the same resolveLocale(field, locale) picks the components make (fr falls
	// back to en per field). Per-locale maps keep block ids collision-free
	// across locale variants of the same doc.
	const locale = localeFromParams(params, url.pathname);
	const codeHighlights = collectCodeHighlights([
		resolveLocale(project.description, locale),
		...project.sections.map((section) => resolveLocale(section.content, locale)),
	]);

	return { project, services, serviceSvgContents, readmeHtml, codeHighlights };
}
