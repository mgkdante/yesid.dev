// /llms.txt + /llms-full.txt bodies (homework #18, 2026-07-01 expert sweep).
// Generated at build time from the same CMS-derived content caches the pages
// read, so both files track CMS truth on every publish→rebuild. Server-only:
// nothing here may reach the client bundle.
import { blogPosts, contactContent, projects, services, siteMeta } from '$lib/content';
import { SITE_HOST, SERVICE_AREAS } from '$lib/utils/seo-defaults';
import { resolveLocale } from '$lib/utils/locale';
import type { LocalizedString } from '$lib/types';

const en = (value: LocalizedString): string => resolveLocale(value, 'en');
const es = (value: LocalizedString): string => resolveLocale(value, 'es');

const visibleServices = () => [...services].filter((s) => s.visible !== false).sort((a, b) => a.station - b.station);

// Web-side ProjectStatus is 'public' | 'private' | 'wip' (NOT Directus's
// draft/published/archived — the fetcher maps them). Public only.
const publishedProjects = () => projects.filter((p) => p.status === 'public');

const absolute = (path: string): string => (path.startsWith('http') ? path : `${SITE_HOST}${path}`);

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
		`${en(siteMeta.tagline)} Yesid O. is a freelance digital infrastructure engineer in Montreal. The four services read as one data flow: store it (databases), move it (pipelines), understand it (dashboards), show it (websites).`,
		'',
		`Available for remote and on-site work across ${serviceAreaList()}.`,
		'',
		`The site is trilingual: every page below also exists in French under ${SITE_HOST}/fr and in Spanish under ${SITE_HOST}/es. Blog posts are the exception: English-only for now.`,
	].join('\n');
}

function contactSection(): string {
	const lines = contactContent.socials.map((s) => `- ${en(s.label)}: ${s.href}`);
	return ['## Contact', ...lines].join('\n');
}

// L2 (launch Phase 4, AEO): a Spanish section so AI answer engines fielding
// Spanish queries ("desarrollador web que hable español en Montréal",
// "consultor de datos Québec") meet native Spanish copy with the /es URLs.
// Service titles/descriptions come from the same CMS caches as the /es pages.
function spanishSection(): string {
	const serviceLines = visibleServices().map(
		(s) => `- [${es(s.title)}](${SITE_HOST}/es/services/${s.id}): ${es(s.description)}`,
	);
	return [
		'## Español — infraestructura digital en Montreal, Québec',
		`Yesid O. es un ingeniero de infraestructura digital freelance en Montreal que trabaja en español, francés e inglés. Desarrollo web, bases de datos y SQL, pipelines y automatización de datos, y dashboards para pymes de Québec — incluida la comunidad hispana. Todo el sitio existe en español bajo ${SITE_HOST}/es.`,
		...serviceLines,
		`Contacto en español: ${SITE_HOST}/es/contact`,
	].join('\n');
}

export function llmsTxt(): string {
	const serviceLines = visibleServices().map(
		(s) => `- [${en(s.title)}](${SITE_HOST}/services/${s.id}): ${en(s.description)}`,
	);
	const projectLines = publishedProjects().map(
		(p) => `- [${en(p.title)}](${SITE_HOST}/projects/${p.slug}): ${en(p.oneLiner)}`,
	);
	const blogLines = blogPosts.map(
		(p) => `- [${p.title}](${absolute(p.url ?? '')}) (${p.lang}): ${p.excerpt}`,
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
		spanishSection(),
		'',
		contactSection(),
		'',
		`Full detail: ${SITE_HOST}/llms-full.txt`,
		'',
	].join('\n');
}

export function llmsFullTxt(): string {
	const serviceBlocks = visibleServices().map((s) => {
		const lines = [`### ${en(s.title)} (${SITE_HOST}/services/${s.id})`, '', en(s.description)];
		if (s.benefitHeadline) lines.push('', `Benefit: ${en(s.benefitHeadline)}`);
		if (s.impactMetric) lines.push(`Impact: ${en(s.impactMetric.value)} (${en(s.impactMetric.label)})`);
		if (s.deliverables?.length) {
			lines.push('', 'Deliverables:', ...s.deliverables.map((d) => `- ${en(d)}`));
		}
		if (s.stack?.length) lines.push('', `Stack: ${s.stack.join(', ')}`);
		return lines.join('\n');
	});
	const projectBlocks = publishedProjects().map((p) => {
		const lines = [`### ${en(p.title)} (${SITE_HOST}/projects/${p.slug})`, '', en(p.oneLiner)];
		const metrics = p.impactMetrics ?? (p.impactMetric ? [p.impactMetric] : []);
		if (metrics.length) {
			lines.push('', 'Impact:', ...metrics.map((m) => `- ${m.value} (${en(m.label)})${m.before ? `, before: ${m.before}` : ''}`));
		}
		if (p.stack.length) lines.push('', `Stack: ${p.stack.join(', ')}`);
		if (p.liveUrl) lines.push(`Live: ${p.liveUrl}`);
		return lines.join('\n');
	});
	const blogBlocks = blogPosts.map(
		(p) => `### ${p.title} (${absolute(p.url ?? '')})\n\nLanguage: ${p.lang}. ${p.excerpt}`,
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
		spanishSection(),
		'',
		contactSection(),
		'',
	].join('\n');
}
