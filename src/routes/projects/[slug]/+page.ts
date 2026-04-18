// Project detail page loader — resolves project by slug, fetches linked service SVGs,
// and optionally fetches the README HTML if the project has a readmeUrl set.
// 404s for unknown slugs or private projects.

import { error } from '@sveltejs/kit';
import { marked } from '$lib/utils/markdown';
import { getProjectBySlug, getServiceById } from '$lib/repositories';
import type { Service } from '$lib/types';

export async function load({ params, fetch }) {
	const project = await getProjectBySlug(params.slug);

	if (!project || project.status === 'private') {
		error(404, { message: 'Project not found' });
	}

	// Resolve linked services from the project's relatedServices IDs.
	// Adapter getServiceById is async, so fan out with Promise.all and then
	// filter out any unresolved (missing-from-data) services.
	const servicesResolved = await Promise.all(
		project.relatedServices.map((id) => getServiceById(id))
	);
	const services: Service[] = servicesResolved.filter(
		(s): s is Service => s !== undefined
	);

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

	// Fetch README and convert markdown → HTML (GitHub raw content)
	let readmeHtml: string | undefined;
	if (project.readmeUrl) {
		// Auto-convert GitHub blob URLs to raw content URLs
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
