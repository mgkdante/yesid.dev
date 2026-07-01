// Project detail page loader — server-only so hydration reuses __data.json
// instead of re-running the load in the browser (reads resolve from the
// static content layer post-27.2).

import { error } from '@sveltejs/kit';
import { marked } from '$lib/server/markdown';
import { fetchServiceSvgContents } from '$lib/utils';
import { resolveLocale } from '$lib/utils/locale';
import { localeFromParams } from '$lib/utils/locale-routing';
import { getProjectBySlug, getServiceById } from '$lib/repositories';
import { projectEntries } from '$lib/server/prerender-entries';
import { collectCodeHighlights } from '$lib/server/code-highlights';
import type { Service } from '$lib/types';

export const entries = projectEntries;

export async function load({ params, fetch, locals, url }: { params: { slug: string; lang?: string }; fetch: typeof globalThis.fetch; locals: App.Locals; url: URL }) {
	const ctx = { pageCache: locals.pageCache };
	const project = await getProjectBySlug(params.slug, ctx);

	if (!project || project.status === 'private') {
		error(404, { message: 'Project not found' });
	}

	const servicesResolved = await Promise.all(
		project.relatedServices.map((id) => getServiceById(id, ctx)),
	);
	const services: Service[] = servicesResolved.filter(
		(s): s is Service => s !== undefined,
	);

	// Resolved from the build-time glob in fetchServiceSvgContents — a runtime
	// self-fetch of /svg/services/* 401s on auth-protected Vercel previews.
	const serviceSvgContents = await fetchServiceSvgContents(fetch, services);

	let readmeHtml: string | undefined;
	if (project.readmeUrl) {
		let readmeUrl = project.readmeUrl;
		if (readmeUrl.includes('github.com') && readmeUrl.includes('/blob/')) {
			readmeUrl = readmeUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
		}
		try {
			const res = await fetch(readmeUrl);
			if (res.ok) {
				const rawMarkdown = await res.text();
				readmeHtml = await marked.parse(rawMarkdown);
			} else {
				// Pages prerender: a failed fetch here ships the page WITHOUT its
				// README until the next deploy. Keep the page rendering (fail-soft)
				// but say so in the build log — silence made this invisible.
				console.warn(`[projects/${params.slug}] README fetch ${res.status} for ${readmeUrl} — section omitted`);
			}
		} catch (err) {
			console.warn(`[projects/${params.slug}] README fetch failed for ${readmeUrl} — section omitted:`, err);
		}
	}

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
