// /llms.txt + /llms-full.txt bodies (homework #18, 2026-07-01 expert sweep).
// Generated at build time from the same CMS-derived content caches the pages
// read, so both files track CMS truth on every publish→rebuild. Server-only:
// nothing here may reach the client bundle.
import { blogPosts, contactContent, projects, services, siteMeta } from '$lib/content';
import { SITE_HOST } from '$lib/utils/seo-defaults';
import { resolveLocale } from '$lib/utils/locale';
import type { LocalizedString } from '$lib/types';

const en = (value: LocalizedString): string => resolveLocale(value, 'en');

const visibleServices = () => [...services].filter((s) => s.visible !== false).sort((a, b) => a.station - b.station);

// Web-side ProjectStatus is 'public' | 'private' | 'wip' (NOT Directus's
// draft/published/archived — the fetcher maps them). Public only.
const publishedProjects = () => projects.filter((p) => p.status === 'public');

const absolute = (path: string): string => (path.startsWith('http') ? path : `${SITE_HOST}${path}`);

function header(): string {
	return [
		`# ${siteMeta.name} (yesid.dev)`,
		'',
		`> ${en(siteMeta.description)}`,
		'',
		`${en(siteMeta.tagline)} Yesid O. is a freelance digital infrastructure engineer in Montreal. The four services read as one data flow: store it (databases), move it (pipelines), understand it (dashboards), show it (websites).`,
		'',
		`The site is bilingual: every page below also exists in French under ${SITE_HOST}/fr.`,
	].join('\n');
}

function contactSection(): string {
	const lines = contactContent.socials.map((s) => `- ${en(s.label)}: ${s.href}`);
	return ['## Contact', ...lines].join('\n');
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
		'## Projects (personal case studies)',
		...projectLines,
		'',
		'## Blog',
		...blogLines,
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
		'## Projects (personal case studies)',
		'',
		projectBlocks.join('\n\n'),
		'',
		'## Blog',
		'',
		blogBlocks.join('\n\n'),
		'',
		contactSection(),
		'',
	].join('\n');
}
