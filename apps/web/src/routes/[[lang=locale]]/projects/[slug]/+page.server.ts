// Project detail page loader — server-only so hydration reuses __data.json
// instead of re-running the load in the browser (reads resolve from the
// static content layer post-27.2).

import { error } from '@sveltejs/kit';
import { marked } from '$lib/server/markdown';
import { fetchServiceSvgContents } from '$lib/utils';
import { getProjectBySlug, getServiceById } from '$lib/repositories';
import { projectEntries } from '$lib/server/prerender-entries';
import { collectCodeHighlights, localizedDocs } from '$lib/server/code-highlights';
import type { Service } from '$lib/types';

export const entries = projectEntries;

export async function load({ params, fetch, locals }: { params: { slug: string }; fetch: typeof globalThis.fetch; locals: App.Locals }) {
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
			}
		} catch {
			// README fetch failed — skip, detail page renders without README section
		}
	}

	// Shiki runs server-side only. Cover every doc surface the detail page
	// renders (description in the glance panel + each section body), across
	// locale variants — block ids key the map, so one flat record serves
	// whichever locale this URL renders.
	const codeHighlights = collectCodeHighlights([
		...localizedDocs(project.description),
		...project.sections.flatMap((section) => localizedDocs(section.content)),
	]);

	return { project, services, serviceSvgContents, readmeHtml, codeHighlights };
}
