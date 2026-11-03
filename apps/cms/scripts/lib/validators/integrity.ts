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
	const counts = new Map<string | number, number>();
	for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
	const duplicates = [...counts].filter(([, count]) => count > 1);
	requireContent(
		duplicates.length === 0,
		`duplicate ${label}: ${duplicates.map(([value, count]) => `${JSON.stringify(value)} (${count} entries)`).join(', ')}`,
	);
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
		`service station numbers must be unique and sequential from 1; expected [${services.map((_, index) => index + 1).join(', ')}]; actual [${stations.join(', ')}]; entries: ${services.map((service) => `${service.id}=${service.station}`).join(', ')}`,
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
	for (const path of ['/services', '/projects', '/blog']) {
		const page = sitePages.find((page) => page.path === path);
		requireContent(
			page,
			`required listing row "${path}" is missing; its detail routes would 404`,
		);
		requireContent(
			page.type === 'listing',
			`site page "${path}" must be listing-typed; actual type: "${page.type}"`,
		);
	}
}

/** Fixture roster floors are not production publishing requirements. */
export function checkFixtureRoster(data: {
	projects: readonly Project[];
	blogPosts: readonly BlogPost[];
}): void {
	requireContent(
		data.projects.some((project) => project.featured),
		'fixture needs at least one featured project',
	);
	requireContent(
		data.blogPosts.length >= 3,
		`fixture needs at least 3 blog posts; actual: ${data.blogPosts.length}`,
	);
}

/** Identify entries by their editorial key so reordering does not change diagnostics. */
export function contentPath(
	root: unknown,
	segments: readonly PropertyKey[],
	prefix = 'content',
): string {
	let value = root;
	let path = prefix;
	for (const segment of segments) {
		const child =
			value && typeof value === 'object'
				? Reflect.get(value, segment)
				: undefined;
		if (typeof segment === 'number') {
			const key =
				child && typeof child === 'object'
					? ['slug', 'id', 'path'].find(
							(key) => typeof Reflect.get(child, key) === 'string',
						)
					: undefined;
			path += key ? `[${key}=${Reflect.get(child, key)}]` : `[${segment}]`;
		} else path += `.${String(segment)}`;
		value = child;
	}
	return path;
}

/** Localized documents have object-valued en keys and must be traversed. */
export function checkLocalization(value: unknown): readonly string[] {
	const issues: string[] = [];
	const seen = new WeakSet<object>();
	const walk = (node: unknown, path: string): void => {
		if (!node || typeof node !== 'object' || seen.has(node)) return;
		seen.add(node);
		if ('en' in node && typeof node.en === 'string') {
			if (!node.en.trim()) issues.push(`${path}.en: empty English value`);
			if (!('fr' in node) || typeof node.fr !== 'string' || !node.fr.trim())
				issues.push(`${path}.fr: missing French translation`);
			seen.delete(node);
			return;
		}
		if (Array.isArray(node))
			node.forEach((child, index) =>
				walk(child, contentPath(node, [index], path)),
			);
		else
			for (const [key, child] of Object.entries(node))
				walk(child, `${path}.${key}`);
		seen.delete(node);
	};
	walk(value, 'content');
	return issues;
}
