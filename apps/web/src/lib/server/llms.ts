// Generate crawler text from the same build-time content as pages; this module stays server-only.
import { blogPosts, contactContent, projects, services, siteMeta } from '#lib/content/index.ts';
import { SITE_HOST, SERVICE_AREAS, canonicalFor } from '#lib/utils/seo-defaults.ts';
import { resolveLocale } from '#lib/utils/locale.ts';
import { isPathPublished, isEntityAvailable, isLocaleAvailable, type AvailabilityContext } from '#lib/utils/content-availability.ts';
import { PUBLISHED_LOCALES } from '#lib/utils/published-locales.ts';
import { orderServices } from '#lib/utils/station.ts';
import type { BlogPost, Locale, LocalizedString } from '#lib/types.ts';

const en = (value: LocalizedString): string => resolveLocale(value, 'en');
const es = (value: LocalizedString): string => resolveLocale(value, 'es');


const localesFor = (context: AvailabilityContext) => context.locales ?? PUBLISHED_LOCALES;
const availableServices = (context: AvailabilityContext, locale: Locale) => orderServices(
	(context.services ?? services).filter((service) => isEntityAvailable({ kind: 'service', entity: service }, locale, context)),
);
const projectRows = (context: AvailabilityContext) => (context.projects ?? projects).flatMap((project) =>
	localesFor(context).filter((locale) => isEntityAvailable({ kind: 'project', entity: project }, locale, context))
		.map((locale) => ({ project, locale })),
);
const serviceRows = (context: AvailabilityContext) => localesFor(context).filter((locale) => locale !== 'es').flatMap((locale) =>
	availableServices(context, locale).map((service) => ({ service, locale })),
);
const availableBlogPosts = (context: AvailabilityContext) => (context.posts ?? blogPosts).filter((post) =>
	isEntityAvailable({ kind: 'post', entity: post }, post.lang, context),
);
const absolute = (path: string): string => path.startsWith('http') ? path : `${SITE_HOST}${path}`;
const blogUrl = (post: BlogPost): string => post.external ? absolute(post.url ?? '') : canonicalFor(`/blog/${post.slug}`, post.lang);
const progress = (status: string) => status === 'wip' ? ' (in progress)' : '';

function serviceAreaList(): string {
	const areas = [...SERVICE_AREAS];
	if (areas.length <= 1) return areas[0] ?? '';
	return `${areas.slice(0, -1).join(', ')}, and ${areas[areas.length - 1]}`;
}

function serviceList(context: AvailabilityContext, locale: Locale, and: string): string {
	const titles = availableServices(context, locale).map((service) => resolveLocale(service.title, locale));
	if (titles.length <= 1) return titles[0] ?? '';
	return `${titles.slice(0, -1).join(', ')}, ${and} ${titles[titles.length - 1]}`;
}

function header(context: AvailabilityContext): string {
	const locales = localesFor(context);
	const languages = locales.length === 3
		? `The site is trilingual: pages below also exist in French under ${SITE_HOST}/fr and in Spanish under ${SITE_HOST}/es. Blog articles are available in English, French, and Spanish.`
		: `Available site languages: ${locales.map((locale) => `${locale} (${canonicalFor('/', locale)})`).join(', ')}.`;
	return [
		`# ${siteMeta.name} (yesid.dev)`, '', `> ${en(siteMeta.description)}`, '',
		`${en(siteMeta.tagline)} Yesid O. works as a Freelance Digital Infrastructure Developer in Montréal. The services cover ${serviceList(context, 'en', 'and')}.`, '',
		`Available for remote and on-site work across ${serviceAreaList()}.`, '', languages,
	].join('\n');
}

function contactSection(context: AvailabilityContext): string {
	if (!isPathPublished('/contact', context.pages)) return '';
	return ['## Contact', ...contactContent.socials.map((social) => `- ${en(social.label)}: ${social.href}`)].join('\n');
}

function spanishSection(context: AvailabilityContext): string {
	if (!isLocaleAvailable('es', context.locales)) return '';
	const serviceLines = availableServices(context, 'es').map((service) =>
		`- [${es(service.title)}](${canonicalFor(`/services/${service.id}`, 'es')}): ${es(service.description)}`,
	);
	return [
		'## Español — infraestructura digital en Montreal, Québec',
		`Yesid O. trabaja como Desarrollador freelance de infraestructura digital en Montreal y atiende en español, francés e inglés. Ayuda a las pymes de Quebec y Canadá a ser más competitivas, más productivas y a generar más valor por empleado: ${serviceList(context, 'es', 'y')}. Todo el sitio existe en español bajo ${SITE_HOST}/es.`,
		...serviceLines,
		...(isPathPublished('/contact', context.pages) ? [`Contacto en español: ${canonicalFor('/contact', 'es')}`] : []),
	].join('\n');
}

export function llmsTxt(context: AvailabilityContext = {}): string {
	const serviceLines = serviceRows(context).map(({ service, locale }) =>
		`- [${resolveLocale(service.title, locale)}](${canonicalFor(`/services/${service.id}`, locale)}): ${resolveLocale(service.description, locale)}`,
	);
	const projectLines = projectRows(context).map(({ project, locale }) =>
		`- [${resolveLocale(project.title, locale)}](${canonicalFor(`/projects/${project.slug}`, locale)}): ${resolveLocale(project.oneLiner, locale)}${progress(project.status)}`,
	);
	const blogLines = availableBlogPosts(context).map((post) => `- [${post.title}](${blogUrl(post)}) (${post.lang}): ${post.excerpt}`);
	return [header(context), '', '## Services', ...serviceLines, '',
		'## Projects (personal builds, documented like case studies)', ...projectLines, '',
		'## Blog', ...blogLines, '', spanishSection(context), '', contactSection(context), '',
		`Full detail: ${SITE_HOST}/llms-full.txt`, '',
	].join('\n');
}

export function llmsFullTxt(context: AvailabilityContext = {}): string {
	const serviceBlocks = serviceRows(context).map(({ service, locale }) => {
		const value = (text: LocalizedString) => resolveLocale(text, locale);
		const lines = [`### ${value(service.title)} (${canonicalFor(`/services/${service.id}`, locale)})`, '', value(service.description)];
		if (service.benefitHeadline) lines.push('', `Benefit: ${value(service.benefitHeadline)}`);
		if (service.impactMetric) lines.push(`Impact: ${value(service.impactMetric.value)} (${value(service.impactMetric.label)})`);
		if (service.deliverables?.length) lines.push('', 'Deliverables:', ...service.deliverables.map((item) => `- ${value(item)}`));
		if (service.stack?.length) lines.push('', `Stack: ${service.stack.join(', ')}`);
		return lines.join('\n');
	});
	const projectBlocks = projectRows(context).map(({ project, locale }) => {
		const value = (text: LocalizedString) => resolveLocale(text, locale);
		const lines = [`### ${value(project.title)} (${canonicalFor(`/projects/${project.slug}`, locale)})${progress(project.status)}`, '', value(project.oneLiner)];
		const metrics = project.impactMetrics ?? (project.impactMetric ? [project.impactMetric] : []);
		if (metrics.length) lines.push('', 'Impact:', ...metrics.map((metric) => `- ${metric.value} (${value(metric.label)})${metric.before ? `, before: ${metric.before}` : ''}`));
		if (project.stack.length) lines.push('', `Stack: ${project.stack.join(', ')}`);
		if (project.liveUrl) lines.push(`Live: ${project.liveUrl}`);
		return lines.join('\n');
	});
	const blogBlocks = availableBlogPosts(context).map((post) => `### ${post.title} (${blogUrl(post)})\n\nLanguage: ${post.lang}. ${post.excerpt}`);
	return [header(context), '', '## Services', '', serviceBlocks.join('\n\n'), '',
		'## Projects (personal builds, documented like case studies)', '', projectBlocks.join('\n\n'), '',
		'## Blog', '', blogBlocks.join('\n\n'), '', spanishSection(context), '', contactSection(context), '',
	].join('\n');
}
