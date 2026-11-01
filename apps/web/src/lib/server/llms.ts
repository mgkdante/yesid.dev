// Generate crawler text from the same build-time content as pages; this module stays server-only.
import { blogPosts, contactContent, projects, services, siteMeta } from '#lib/content/index.ts';
import { SITE_HOST, SERVICE_AREAS, canonicalFor } from '#lib/utils/seo-defaults.ts';
import { resolveLocale } from '#lib/utils/locale.ts';
import { sitePages } from '#lib/content/site-pages.ts';
import { isPathPublished } from '#lib/utils/page-registry.ts';
import type { BlogPost, LocalizedString, SitePage } from '#lib/types.ts';

const en = (value: LocalizedString): string => resolveLocale(value, 'en');
const es = (value: LocalizedString): string => resolveLocale(value, 'es');

const visibleServices = (pages: readonly SitePage[]) => [...services].filter((s) => s.visible !== false && isPathPublished(`/services/${s.id}`, pages)).sort((a, b) => a.station - b.station);

// Web-side ProjectStatus is 'public' | 'private' | 'wip' (NOT Directus's
// draft/published/archived — the fetcher maps them). Public only.
const publishedProjects = (pages: readonly SitePage[]) => projects.filter((p) => p.status === 'public' && isPathPublished(`/projects/${p.slug}`, pages));
const publishedBlogPosts = (pages: readonly SitePage[]) => blogPosts.filter((post) => isPathPublished(`/blog/${post.slug}`, pages));

const absolute = (path: string): string => (path.startsWith('http') ? path : `${SITE_HOST}${path}`);
const blogUrl = (post: BlogPost): string =>
	post.external
		? absolute(post.url ?? '')
		: canonicalFor(`/blog/${post.slug}`, post.lang);

// Serialize SERVICE_AREAS as a natural-language list ("A, B, and C") so the
// served geography is legible to answer engines fielding "...in <city>" queries.
function serviceAreaList(): string {
	const areas = [...SERVICE_AREAS];
	if (areas.length <= 1) return areas[0] ?? '';
	return `${areas.slice(0, -1).join(', ')}, and ${areas[areas.length - 1]}`;
}

function header(): string {
	return [
		`# ${siteMeta.name} (yesid.dev)`,
		'',
		`> ${en(siteMeta.description)}`,
		'',
		`${en(siteMeta.tagline)} Yesid O. works as a Freelance Digital Infrastructure Developer in Montréal. The four services cover websites and e-commerce, automation and pipelines, dashboards and analytics, and databases and SQL.`,
		'',
		`Available for remote and on-site work across ${serviceAreaList()}.`,
		'',
		`The site is trilingual: pages below also exist in French under ${SITE_HOST}/fr and in Spanish under ${SITE_HOST}/es. Blog articles are available in English, French, and Spanish.`,
	].join('\n');
}

function contactSection(pages: readonly SitePage[]): string {
	if (!isPathPublished('/contact', pages)) return '';
	const lines = contactContent.socials.map((s) => `- ${en(s.label)}: ${s.href}`);
	return ['## Contact', ...lines].join('\n');
}

function spanishSection(pages: readonly SitePage[]): string {
	const serviceLines = visibleServices(pages).map(
		(s) => `- [${es(s.title)}](${SITE_HOST}/es/services/${s.id}): ${es(s.description)}`,
	);
	return [
		'## Español — infraestructura digital en Montreal, Québec',
		`Yesid O. trabaja como Desarrollador freelance de infraestructura digital en Montreal y atiende en español, francés e inglés. Ayuda a empresas de Québec y de todo Canadá con sitios web y e-commerce, automatización y pipelines, tableros y analítica, y bases de datos y SQL. Todo el sitio existe en español bajo ${SITE_HOST}/es.`,
		...serviceLines,
		...(isPathPublished('/contact', pages) ? [`Contacto en español: ${SITE_HOST}/es/contact`] : []),
	].join('\n');
}

export function llmsTxt(pages: readonly SitePage[] = sitePages): string {
	const serviceLines = visibleServices(pages).map(
		(s) => `- [${en(s.title)}](${SITE_HOST}/services/${s.id}): ${en(s.description)}`,
	);
	const projectLines = publishedProjects(pages).map(
		(p) => `- [${en(p.title)}](${SITE_HOST}/projects/${p.slug}): ${en(p.oneLiner)}`,
	);
	const blogLines = publishedBlogPosts(pages).map(
		(p) => `- [${p.title}](${blogUrl(p)}) (${p.lang}): ${p.excerpt}`,
	);
	return [
		header(),
		'',
		'## Services',
		...serviceLines,
		'',
		'## Projects (personal builds, documented like case studies)',
		...projectLines,
		'',
		'## Blog',
		...blogLines,
		'',
		spanishSection(pages),
		'',
		contactSection(pages),
		'',
		`Full detail: ${SITE_HOST}/llms-full.txt`,
		'',
	].join('\n');
}

export function llmsFullTxt(pages: readonly SitePage[] = sitePages): string {
	const serviceBlocks = visibleServices(pages).map((s) => {
		const lines = [`### ${en(s.title)} (${SITE_HOST}/services/${s.id})`, '', en(s.description)];
		if (s.benefitHeadline) lines.push('', `Benefit: ${en(s.benefitHeadline)}`);
		if (s.impactMetric) lines.push(`Impact: ${en(s.impactMetric.value)} (${en(s.impactMetric.label)})`);
		if (s.deliverables?.length) {
			lines.push('', 'Deliverables:', ...s.deliverables.map((d) => `- ${en(d)}`));
		}
		if (s.stack?.length) lines.push('', `Stack: ${s.stack.join(', ')}`);
		return lines.join('\n');
	});
	const projectBlocks = publishedProjects(pages).map((p) => {
		const lines = [`### ${en(p.title)} (${SITE_HOST}/projects/${p.slug})`, '', en(p.oneLiner)];
		const metrics = p.impactMetrics ?? (p.impactMetric ? [p.impactMetric] : []);
		if (metrics.length) {
			lines.push('', 'Impact:', ...metrics.map((m) => `- ${m.value} (${en(m.label)})${m.before ? `, before: ${m.before}` : ''}`));
		}
		if (p.stack.length) lines.push('', `Stack: ${p.stack.join(', ')}`);
		if (p.liveUrl) lines.push(`Live: ${p.liveUrl}`);
		return lines.join('\n');
	});
	const blogBlocks = publishedBlogPosts(pages).map(
		(p) => `### ${p.title} (${blogUrl(p)})\n\nLanguage: ${p.lang}. ${p.excerpt}`,
	);
	return [
		header(),
		'',
		'## Services',
		'',
		serviceBlocks.join('\n\n'),
		'',
		'## Projects (personal builds, documented like case studies)',
		'',
		projectBlocks.join('\n\n'),
		'',
		'## Blog',
		'',
		blogBlocks.join('\n\n'),
		'',
		spanishSection(pages),
		'',
		contactSection(pages),
		'',
	].join('\n');
}
