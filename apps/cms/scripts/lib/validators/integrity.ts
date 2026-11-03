import type {
	BlogPost,
	Project,
	Service,
	SitePage,
	SiteMeta,
} from '@repo/shared';

export interface Relations {
	projects: readonly Project[];
	services: readonly Service[];
}

function requireContent(
	condition: unknown,
	message: string,
): asserts condition {
	if (!condition) throw new Error(`Content integrity failed: ${message}`);
}

function unique(values: readonly (string | number)[], label: string): void {
	requireContent(new Set(values).size === values.length, `duplicate ${label}`);
}

const urlSafe = /^[a-z0-9-]+$/;

export function checkSiteMeta({ siteMeta }: { siteMeta: SiteMeta }): void {
	for (const key of ['email', 'github'] as const) {
		requireContent(
			siteMeta.links[key].trim().length > 0,
			`site metadata has no ${key} link`,
		);
	}
}

export function checkProjects(
	{ projects }: { projects: readonly Project[] },
	relations: Relations,
): void {
	unique(
		projects.map((project) => project.slug),
		'project slug',
	);
	const services = new Set(relations.services.map((service) => service.id));
	for (const project of projects) {
		requireContent(
			urlSafe.test(project.slug),
			`project slug "${project.slug}" is not URL-safe`,
		);
		requireContent(
			project.stack.length > 0,
			`project "${project.slug}" has no stack`,
		);
		requireContent(
			project.status !== 'public' || project.relatedServices.length > 0,
			`public project "${project.slug}" has no related services`,
		);
		for (const id of project.relatedServices) {
			requireContent(
				services.has(id),
				`service "${id}" in project "${project.slug}" not found`,
			);
		}
	}
}

export function checkServices(
	{ services }: { services: readonly Service[] },
	relations: Relations,
): void {
	requireContent(services.length > 0, 'at least one service is required');
	unique(
		services.map((service) => service.id),
		'service id',
	);
	const stations = services
		.map((service) => service.station)
		.sort((a, b) => a - b);
	requireContent(
		stations.every((station, index) => station === index + 1),
		'service station numbers must be unique and sequential from 1',
	);
	const projects = new Set(relations.projects.map((project) => project.slug));
	for (const service of services) {
		requireContent(service.id.trim().length > 0, 'empty service id');
		if (service.svg)
			requireContent(
				/\.svg$/.test(service.svg),
				`invalid SVG filename in service "${service.id}"`,
			);
		for (const slug of service.relatedProjects) {
			requireContent(
				projects.has(slug),
				`project "${slug}" in service "${service.id}" not found`,
			);
		}
	}
}

export function checkBlog({
	blogPosts,
}: {
	blogPosts: readonly BlogPost[];
}): void {
	unique(
		blogPosts.map((post) => post.slug),
		'blog slug',
	);
	for (const post of blogPosts) {
		requireContent(
			urlSafe.test(post.slug),
			`blog slug "${post.slug}" is not URL-safe`,
		);
		requireContent(
			/^\d{4}-\d{2}-\d{2}$/.test(post.date) &&
				!Number.isNaN(Date.parse(post.date)),
			`invalid date in post "${post.slug}"`,
		);
		requireContent(post.tags.length > 0, `post "${post.slug}" has no tags`);
		requireContent(
			post.url.trim().length > 0,
			`post "${post.slug}" has no URL`,
		);
	}
}

export function checkSitePages({
	sitePages,
}: {
	sitePages: readonly SitePage[];
}): void {
	unique(
		sitePages.map((page) => page.path),
		'site page path',
	);
	requireContent(
		sitePages.some((page) => page.path === '/'),
		'site page registry has no root',
	);
	for (const page of sitePages) {
		if (['/services', '/projects', '/blog'].includes(page.path)) {
			requireContent(
				page.type === 'listing',
				`site page "${page.path}" must be listing-typed`,
			);
		}
	}
}

/** Localized documents have object-valued en keys and are traversed, not treated as string leaves. */
export function checkLocalization(
	value: unknown,
	path = 'content',
	seen = new WeakSet<object>(),
): void {
	if (!value || typeof value !== 'object' || seen.has(value)) return;
	seen.add(value);
	if ('en' in value && typeof value.en === 'string') {
		const localized = value as { en: string; fr?: unknown; es?: unknown };
		requireContent(
			localized.en.trim().length > 0,
			`${path}: empty English value`,
		);
		requireContent(
			typeof localized.fr === 'string' && localized.fr.trim().length > 0,
			`${path}: missing French translation`,
		);
		return;
	}
	for (const [key, child] of Object.entries(value))
		checkLocalization(child, `${path}.${key}`, seen);
}
