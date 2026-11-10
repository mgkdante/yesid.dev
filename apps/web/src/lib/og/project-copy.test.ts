import type { Project } from '#lib/types.ts';
import { describe, expect, it } from 'vitest';
import { createContentCatalog } from '#lib/catalog/index.ts';
import { projectsSlugSeoFactory } from '#lib/adapters/route-seo-factories.ts';
import { projectFactory } from '../../tests/factories';
import { projects } from '#lib/content/projects.ts';
import { createOgCardRenderer } from './render';
import { inlinedOgFontFiles } from './font-files';
import { escapeXml } from './card';
import { loadOgTitle } from './load-title';
import { render } from 'svelte/server';
import { SeoHead } from '@yesid/ui/head';
import { seoHeadProps } from '#lib/utils/seo-defaults.ts';
import { projectCopy } from './project-copy';
import { SHARE_CTA, withShareCta } from './share-copy';

const slugs = ['transit-data-pipeline', 'cafe-arona', 'yesid-design', 'yesid-dev', 'new-project'];
const locales = ['en', 'fr', 'es'] as const;
const oneLiner = {
	en: 'A CMS summary that changes when the project editor saves a new version.',
	fr: 'Une ligne du CMS qui change lorsque la personne responsable modifie le projet.',
	es: 'Una línea del CMS que cambia cuando la persona responsable modifica el proyecto.',
};
async function outputs(project: ReturnType<typeof projectFactory.build>, locale: typeof locales[number]) {
	const catalog = createContentCatalog({ projects: [project] });
	const seo = await projectsSlugSeoFactory({ params: { slug: project.slug }, locale, catalog, siteMeta: catalog.meta.site(), siteSeoDefaults: catalog.meta.siteSeoDefaults() });
	const card = await loadOgTitle('project', project.slug, locale, { projects: [project] });
	return { seo, card };
}
describe('CMS project share copy', () => {
	it.each(slugs)('%s follows edited CMS copy in every locale', async (slug) => {
		for (const locale of locales) {
			for (const suffix of ['', ' Updated.']) {
				const copy = Object.fromEntries(locales.map((lang) => [lang, oneLiner[lang] + suffix])) as typeof oneLiner;
				const { seo, card } = await outputs(projectFactory.build({ slug, oneLiner: copy }), locale);
				expect(seo.description[locale]).toBe(withShareCta(copy[locale], SHARE_CTA.project.label[locale]));
				expect(card?.subtitle).toBe(copy[locale]);
			}
		}
	});
	it.each(projects)('renders $slug summaries completely in each locale', async (project) => {
		const renderer = createOgCardRenderer(inlinedOgFontFiles());
		for (const locale of locales) {
			const { seo, card } = await outputs(project, locale);
			expect(card).not.toBeNull();
			const fallback = createContentCatalog().meta.siteSeoDefaults().defaultDescription;
			expect(seo.description[locale]).toBe(projectCopy(project, locale, fallback).description);
			const head = render(SeoHead, { props: seoHeadProps(seo, locale) }).head;
			const meta = /<meta name="description" content="([^"]*)"/.exec(head)?.[1];
			const og = /<meta property="og:description" content="([^"]*)"/.exec(head)?.[1];
			expect(meta).toBe(escapeXml(projectCopy(project, locale, fallback).description).replaceAll('"', '&quot;'));
			expect(og).toBe(meta);
			expect(card?.subtitle).toBe((project.oneLiner[locale]?.trim() || project.oneLiner.en).replace(/\s+/gu, ' ').trim());
			const svg = renderer.svg(card!);
			const text = Array.from(svg.matchAll(/<text[^>]*>(.*?)<\/text>/g), (match) => match[1]).join(' ');
			expect(text).toContain(escapeXml(card!.subtitle!));
			expect(renderer.png(card!).byteLength).toBeLessThan(150_000);
		}
	}, 30_000);
	it('uses the site default for metadata when neither CMS candidate fits', async () => {
		const project = { ...projectFactory.build(), oneLiner: { en: 'x'.repeat(201) }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'long-description', type: 'paragraph' as const, data: { text: 'y'.repeat(201) } }] } } };
		for (const locale of locales) {
			const { seo, card } = await outputs(project, locale);
			const fallback = createContentCatalog().meta.siteSeoDefaults().defaultDescription;
			expect(seo.description[locale]).toBe(fallback[locale] ?? fallback.en);
			expect(card?.subtitle).toBe('x'.repeat(201));
		}
	});
	it('keeps a short one-liner on the card and uses leading whole description sentences for metadata', async () => {
		const text = 'This project gives every website a consistent visual language. It keeps familiar controls together.';
		const project = projectFactory.build({ oneLiner: { en: 'One look for every site.' }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph', data: { text: text + ' ' + 'A very long sentence '.repeat(30) + '.' } }] } } });
		const { seo, card } = await outputs(project, 'en');
		expect(card?.subtitle).toBe('One look for every site.');
		expect(seo.description.en).toBe(withShareCta(text, SHARE_CTA.project.label.en));
	});
	it.each([
		['fr', '« Un projet utile pour toutes les équipes. » Il simplifie le travail quotidien !'],
		['es', '¿Quieres un sitio coherente para todo tu equipo? ¡Este proyecto lo hace posible!'],
		['en', 'Dr. Smith builds tools for teams, e.g. a shared website. They simplify daily work.'],
	] as const)('keeps complete %s sentences and punctuation', (locale, text) => {
		const project: Project = { ...projectFactory.build(), oneLiner: { en: '' }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph', data: { text: text + ' ' + 'Too long '.repeat(50) + '.' } }] } } };
		const copy = projectCopy(project, locale, { en: 'Fallback' });
		expect(copy.line).toBe(text);
		expect(copy.description).toBe(withShareCta(text, SHARE_CTA.project.label[locale]));
	});
	it.each([
		['en', 'This project helps teams publish useful reports, dashboards, maps, etc.'],
		['en', 'This project helps teams publish useful reports across the U.S.'],
		['fr', 'Ce projet aide toutes les équipes à publier des rapports utiles, etc.'],
		['es', 'Este proyecto ayuda a los equipos a publicar informes útiles en U.S.'],
	] as const)('retains complete %s overviews ending in abbreviations', (locale, text) => {
		const project: Project = { ...projectFactory.build(), oneLiner: { en: 'Tiny.' }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph', data: { text } }] } } };
		expect(projectCopy(project, locale, { en: 'Site default' }).description).toBe(withShareCta(text, SHARE_CTA.project.label[locale]));
	});

	it.each([
		['en', 'This project lets every team share useful reports and dashboards, e.g.'],
		['fr', 'Ce projet permet à toutes les équipes de partager des données utiles, p. ex.'],
		['es', 'Este proyecto permite a todos los equipos compartir datos importantes, p. ej.'],
		['fr', 'Ce projet permet à toutes les équipes de partager des données avec Mme.'],
		['es', 'Este proyecto permite a todos los equipos compartir datos con el Sr.'],
	] as const)('rejects %s abbreviation fragments before over-budget continuations', (locale, prefix) => {
		const text = prefix + ' ' + 'Continuation '.repeat(30) + '.';
		const project: Project = { ...projectFactory.build(), oneLiner: { en: 'Tiny.' }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph', data: { text } }] } } };
		expect(projectCopy(project, locale, { en: 'Site default' }).description).toBe('Site default');
	});

	it.each(['e.g.', 'i.e.', 'p. ex.', 'p. ej.', 'Dr.', 'M.', 'Mme.', 'Sr.', 'Sra.', 'núm.', 'env.'])(
		'keeps %s attached to an over-budget continuation after a complete sentence', (abbreviation) => {
			const first = 'This project gives every website a consistent visual language.';
			const text = `${first} Teams share useful reports and dashboards with ${abbreviation} ${'Continuation '.repeat(30)}.`;
			const project: Project = { ...projectFactory.build(), oneLiner: { en: 'Tiny.' }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph', data: { text } }] } } };
			expect(projectCopy(project, 'en', { en: 'Site default' }).description).toBe(withShareCta(first, SHARE_CTA.project.label.en));
		},
	);
	it.each([
		['en', 'This project catalogues books written by J.R.R. Tolkien'],
		['en', 'This project connects teams at the U.S. Department of Transportation'],
		['en', 'This project helps teams publish useful reports using... one shared workflow'],
		['fr', 'Ce projet catalogue les livres écrits par J.R.R. Tolkien'],
		['es', 'Este proyecto permite compartir informes usando… un flujo común'],
	] as const)('keeps %s continuations whole when they exceed the budget', (locale, prefix) => {
		for (const first of ['', 'This project gives every website a consistent visual language. ']) {
			const text = first + prefix + ' ' + 'Continuation '.repeat(30) + '.';
			const project: Project = { ...projectFactory.build(), oneLiner: { en: 'Tiny.' }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph', data: { text } }] } } };
			expect(projectCopy(project, locale, { en: 'Site default' }).description).toBe(first ? withShareCta(first.trim(), SHARE_CTA.project.label[locale]) : 'Site default');
		}
	});

	it('uses a valid one-liner alone when the CTA would exceed 200 characters', () => {
		const line = 'Useful project context '.repeat(8).trim() + ' for teams.';
		const project = { ...projectFactory.build(), oneLiner: { en: line } };
		expect(projectCopy(project, 'en', { en: 'Fallback' })).toEqual({ line, description: line });
	});
	it('uses the site default when all project copy is empty or unfinished', () => {
		const project: Project = { ...projectFactory.build(), oneLiner: { en: '' }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph', data: { text: 'An unfinished overview' } }] } } };
		expect(projectCopy(project, 'en', { en: 'Site default' })).toEqual({ line: 'Site default', description: 'Site default' });
	});
	it.each([undefined, '', '   '])('uses English for missing translated one-liners (%s)', async (missing) => {
		const project = { ...projectFactory.build(), oneLiner: { en: oneLiner.en, fr: missing, es: missing } };
		for (const locale of ['fr', 'es'] as const) {
			const { seo, card } = await outputs(project, locale);
			expect(seo.description[locale]).toBe(withShareCta(oneLiner.en, SHARE_CTA.project.label[locale]));
			expect(card?.subtitle).toBe(oneLiner.en);
		}
	});
	it('uses complete description text for metadata while retaining the long OG one-liner', async () => {
		for (const locale of locales) {
			const description = { time: 1, version: '2.31.2', blocks: [{ id: 'cms-description', type: 'paragraph' as const, data: { text: oneLiner[locale] } }] };
			const project = { ...projectFactory.build(), oneLiner: { en: 'Long sentence. '.repeat(20) }, description: { en: description, fr: description, es: description } };
			const { seo, card } = await outputs(project, locale);
			expect(seo.description[locale]).toBe(withShareCta(oneLiner[locale], SHARE_CTA.project.label[locale]));
			expect(card?.subtitle).toBe('Long sentence. '.repeat(20).trim());
		}
	});
});
