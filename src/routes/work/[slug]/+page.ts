// Work detail page loader — resolves project by slug, fetches linked service SVGs,
// and optionally fetches the README HTML if the project has a readmeUrl set.
// 404s for unknown slugs or private projects.

import { error } from '@sveltejs/kit';
import { getProjectBySlug, getServiceById } from '$lib/data';
import type { Service } from '$lib/data/types.js';

export async function load({ params, fetch }) {
	const project = getProjectBySlug(params.slug);

	if (!project || project.status === 'private') {
		error(404, { message: 'Project not found' });
	}

	// Resolve linked services from the project's relatedServices IDs
	const services: Service[] = project.relatedServices
		.map((id) => getServiceById(id))
		.filter((s): s is Service => s !== undefined);

	// Load service SVG contents for badges in the sidebar
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

	// Fetch README if URL is set (GitHub raw content, etc.)
	let readmeHtml: string | undefined;
	if (project.readmeUrl) {
		try {
			const res = await fetch(project.readmeUrl);
			if (res.ok) {
				readmeHtml = await res.text();
			}
		} catch {
			// README fetch failed — skip, detail page renders without README section
		}
	}

	return { project, services, serviceSvgContents, readmeHtml };
}
