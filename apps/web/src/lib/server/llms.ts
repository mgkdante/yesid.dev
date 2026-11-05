// Generate crawler text from the same build-time content as pages; this module stays server-only.
import { createContentCatalog, type ContentCatalog } from '#lib/catalog/index.ts';
import { SITE_HOST, SERVICE_AREAS, canonicalFor } from '#lib/utils/seo-defaults.ts';
import { resolveLocale } from '#lib/utils/locale.ts';
import { type AvailabilityContext } from '#lib/catalog/availability.ts';
import { orderServices } from '#lib/utils/station.ts';
import type { BlogPost, ImpactMetric, Locale, LocalizedString } from '#lib/types.ts';

const en = (value: LocalizedString): string => resolveLocale(value, 'en');
const es = (value: LocalizedString): string => resolveLocale(value, 'es');


const availableServices = (content: ContentCatalog, locale: Locale) => orderServices(content.services.available(locale));
const projectRows = (content: ContentCatalog) => content.locales.flatMap((locale) => content.projects.available(locale).map((project) => ({ project, locale })));
const serviceRows = (content: ContentCatalog) => content.locales.filter((locale) => locale !== 'es').flatMap((locale) =>
	availableServices(content, locale).map((service) => ({ service, locale })),
);
const availableBlogPosts = (content: ContentCatalog) => content.blog.all();
const absolute = (path: string): string => path.startsWith('http') ? path : `${SITE_HOST}${path}`;
const blogUrl = (post: BlogPost): string => post.external ? absolute(post.url ?? '') : canonicalFor(`/blog/${post.slug}`, post.lang);
const progress = (status: string) => status === 'wip' ? ' (in progress)' : '';

function metricText(metric: ImpactMetric, locale: Locale): string {
	const sources = (metric.sources ?? []).map(source => `; source: ${source.label} (${source.url})`).join('');
	return `${resolveLocale(metric.value, locale)} (${resolveLocale(metric.label, locale)})${metric.before ? `, before: ${metric.before}` : ''}${metric.sourceUrl ? `; source: ${metric.sourceUrl}` : ''}${sources}${metric.asOf ? `; as of: ${metric.asOf}` : ''}`;
}

function serviceAreaList(): string {
	const areas = [...SERVICE_AREAS];
	if (areas.length <= 1) return areas[0] ?? '';
	return `${areas.slice(0, -1).join(', ')}, and ${areas[areas.length - 1]}`;
}

function serviceList(content: ContentCatalog, locale: Locale, and: string): string {
	const titles = availableServices(content, locale).map((service) => resolveLocale(service.title, locale));
	if (titles.length <= 1) return titles[0] ?? '';
	return `${titles.slice(0, -1).join(', ')}, ${and} ${titles[titles.length - 1]}`;
}

function header(content: ContentCatalog): string {
	const locales = content.locales;
	const siteMeta = content.meta.site();
	const languages = locales.length === 3
		? `The site is trilingual: pages below also exist in French under ${SITE_HOST}/fr and in Spanish under ${SITE_HOST}/es. Blog articles are available in English, French, and Spanish.`
		: `Available site languages: ${locales.map((locale) => `${locale} (${canonicalFor('/', locale)})`).join(', ')}.`;
	return [
		`# ${siteMeta.name} (yesid.dev)`, '', `> ${en(siteMeta.description)}`, '',
		`${en(siteMeta.tagline)} Yesid O. works as a Freelance Digital Infrastructure Developer in Montréal. The services cover ${serviceList(content, 'en', 'and')}.`, '',
		`Available for remote and on-site work across ${serviceAreaList()}.`, '', languages,
	].join('\n');
}

function contactSection(content: ContentCatalog): string {
	if (!content.isPathPublished('/contact')) return '';
	return ['## Contact', ...content.content.contactPage().socials.map((social) => `- ${en(social.label)}: ${social.href}`)].join('\n');
}

function spanishSection(content: ContentCatalog): string {
	if (!content.isLocaleAvailable('es')) return '';
	const serviceLines = availableServices(content, 'es').map((service) =>
		`- [${es(service.title)}](${canonicalFor(`/services/${service.id}`, 'es')}): ${es(service.description)}`,
	);
	return [
		'## Español — infraestructura digital en Montreal, Québec',
		`Yesid O. trabaja como Desarrollador freelance de infraestructura digital en Montreal y atiende en español, francés e inglés. Ayuda a las pymes de Quebec y Canadá a ser más competitivas, más productivas y a generar más valor por empleado: ${serviceList(content, 'es', 'y')}. Todo el sitio existe en español bajo ${SITE_HOST}/es.`,
		...serviceLines,
		...(content.isPathPublished('/contact') ? [`Contacto en español: ${canonicalFor('/contact', 'es')}`] : []),
	].join('\n');
}

export function llmsTxt(context: AvailabilityContext = {}): string {
	const content = createContentCatalog(context);
	const serviceLines = serviceRows(content).map(({ service, locale }) =>
		`- [${resolveLocale(service.title, locale)}](${canonicalFor(`/services/${service.id}`, locale)}): ${resolveLocale(service.description, locale)}`,
	);
	const projectLines = projectRows(content).map(({ project, locale }) =>
		`- [${resolveLocale(project.title, locale)}](${canonicalFor(`/projects/${project.slug}`, locale)}): ${resolveLocale(project.oneLiner, locale)}${progress(project.status)}`,
	);
	const blogLines = availableBlogPosts(content).map((post) => `- [${post.title}](${blogUrl(post)}) (${post.lang}): ${post.excerpt}`);
	return [header(content), '', '## Services', ...serviceLines, '',
		'## Projects (personal builds, documented like case studies)', ...projectLines, '',
		'## Blog', ...blogLines, '', spanishSection(content), '', contactSection(content), '',
		`Full detail: ${SITE_HOST}/llms-full.txt`, '',
	].join('\n');
}

export function llmsFullTxt(context: AvailabilityContext = {}): string {
	const content = createContentCatalog(context);
	const serviceBlocks = serviceRows(content).map(({ service, locale }) => {
		const value = (text: LocalizedString) => resolveLocale(text, locale);
		const lines = [`### ${value(service.title)} (${canonicalFor(`/services/${service.id}`, locale)})`, '', value(service.description)];
		if (service.benefitHeadline) lines.push('', `Benefit: ${value(service.benefitHeadline)}`);
		if (service.impactMetric) lines.push(`Impact: ${metricText(service.impactMetric, locale)}`);
		if (service.deliverables?.length) lines.push('', 'Deliverables:', ...service.deliverables.map((item) => `- ${value(item)}`));
		if (service.stack?.length) lines.push('', `Stack: ${service.stack.join(', ')}`);
		return lines.join('\n');
	});
	const projectBlocks = projectRows(content).map(({ project, locale }) => {
		const value = (text: LocalizedString) => resolveLocale(text, locale);
		const lines = [`### ${value(project.title)} (${canonicalFor(`/projects/${project.slug}`, locale)})${progress(project.status)}`, '', value(project.oneLiner)];
		const metrics = project.impactMetrics ?? [];
		if (metrics.length) lines.push('', 'Impact:', ...metrics.map((metric) => `- ${metricText(metric, locale)}`));
		if (project.stack.length) lines.push('', `Stack: ${project.stack.join(', ')}`);
		if (project.liveUrl) lines.push(`Live: ${project.liveUrl}`);
		return lines.join('\n');
	});
	const blogBlocks = availableBlogPosts(content).map((post) => `### ${post.title} (${blogUrl(post)})\n\nLanguage: ${post.lang}. ${post.excerpt}`);
	return [header(content), '', '## Services', '', serviceBlocks.join('\n\n'), '',
		'## Projects (personal builds, documented like case studies)', '', projectBlocks.join('\n\n'), '',
		'## Blog', '', blogBlocks.join('\n\n'), '', spanishSection(content), '', contactSection(content), '',
	].join('\n');
}
