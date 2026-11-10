import { describe, expect, it } from 'vitest';
import { createContentCatalog } from '#lib/catalog/index.ts';
import { projectsSlugSeoFactory } from '#lib/adapters/route-seo-factories.ts';
import { projectFactory } from '../../tests/factories';
import { projects } from '#lib/content/projects.ts';
import { createOgCardRenderer } from './render';
import { inlinedOgFontFiles } from './font-files';
import { escapeXml } from './card';
import { loadOgTitle } from './load-title';
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
				expect(seo.description[locale]).toBe(withShareCta(project.oneLiner[locale] ?? project.oneLiner.en, SHARE_CTA.project.label[locale]));
				const svg = renderer.svg(card!);
				const text = Array.from(svg.matchAll(/<text[^>]*>(.*?)<\/text>/g), (match) => match[1]).join(' ');
				expect(text).toContain(escapeXml(card!.subtitle!));
				expect(renderer.png(card!).byteLength).toBeLessThan(150_000);
		}
	}, 30_000);
	it('uses the site default when neither CMS candidate fits', async () => {
		const project = { ...projectFactory.build(), oneLiner: { en: 'x'.repeat(201) }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'long-description', type: 'paragraph' as const, data: { text: 'y'.repeat(201) } }] } } };
		for (const locale of locales) {
			const { seo, card } = await outputs(project, locale);
			const fallback = createContentCatalog().meta.siteSeoDefaults().defaultDescription;
			expect(seo.description[locale]).toBe(fallback[locale] ?? fallback.en);
			expect(card?.subtitle).toBe(seo.description[locale]);
		}
	});
	it.each([undefined, '', '   '])('uses English for missing translated one-liners (%s)', async (missing) => {
		const project = { ...projectFactory.build(), oneLiner: { en: oneLiner.en, fr: missing, es: missing } };
		for (const locale of ['fr', 'es'] as const) {
			const { seo, card } = await outputs(project, locale);
			expect(seo.description[locale]).toBe(withShareCta(oneLiner.en, SHARE_CTA.project.label[locale]));
			expect(card?.subtitle).toBe(oneLiner.en);
		}
	});
	it('falls back to complete description text for an overly long one-liner', async () => {
		for (const locale of locales) {
			const description = { time: 1, version: '2.31.2', blocks: [{ id: 'cms-description', type: 'paragraph' as const, data: { text: oneLiner[locale] } }] };
			const project = { ...projectFactory.build(), oneLiner: { en: 'Long sentence. '.repeat(20) }, description: { en: description, fr: description, es: description } };
			const { seo, card } = await outputs(project, locale);
			expect(seo.description[locale]).toBe(withShareCta(oneLiner[locale], SHARE_CTA.project.label[locale]));
			expect(card?.subtitle).toBe(oneLiner[locale]);
		}
	});
});
