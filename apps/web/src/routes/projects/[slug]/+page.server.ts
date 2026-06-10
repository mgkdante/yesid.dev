// Project detail page loader — server-only so hydration reuses __data.json
// instead of re-running the load in the browser (reads resolve from the
// static content layer post-27.2).

import { error } from '@sveltejs/kit';
import { marked } from '$lib/utils/markdown';
import { getProjectBySlug, getServiceById } from '$lib/repositories';
import type { Service } from '$lib/types';

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

	const serviceSvgContents: Record<string, string> = {};
	for (const service of services) {
		if (service.svg) {
			try {
				const res = await fetch(`/svg/services/${service.svg}`);
				if (res.ok) {
					serviceSvgContents[service.id] = await res.text();
				}
			} catch {
				// SVG not found — skip silently, badge renders without icon
			}
		}
	}

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

	return { project, services, serviceSvgContents, readmeHtml };
}
