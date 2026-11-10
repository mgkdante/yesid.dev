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
	it('keeps a fitting 218-character OG line and falls back to complete overview metadata', async () => {
		const line = 'A bilingual publishing platform that helps local teams manage their websites, share useful information with customers, automate repetitive updates, and keep their content accessible across English, French, and Spanish.';
		const overview = 'This platform helps local teams publish useful information in three languages.';
		const project = { ...projectFactory.build(), oneLiner: { en: line }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph' as const, data: { text: overview } }] } } };
		for (const locale of locales) {
			const { seo, card } = await outputs(project, locale);
			expect(card?.subtitle).toBe(line);
			expect(seo.description[locale]).toBe(withShareCta(overview, SHARE_CTA.project.label[locale]));
		}
	});
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
		['fr', 'Ce projet accompagne les équipes et les clients de la Dre. Tremblay'],
		['es', 'Este proyecto acompaña a los equipos y a los pacientes en la consulta de la Dra. García'],
		['en', 'This project lets every team share useful reports and dashboards, e.g. examples'],
		['fr', 'Ce projet permet à toutes les équipes de partager des données utiles, p. ex. les horaires'],
		['es', 'Este proyecto permite a todos los equipos compartir datos importantes, p. ej. los horarios'],
		['fr', 'Ce projet permet à toutes les équipes de partager des données avec Mme.'],
		['es', 'Este proyecto permite a todos los equipos compartir datos con el Sr.'],
	] as const)('rejects %s abbreviation fragments before over-budget continuations', (locale, prefix) => {
		const text = prefix + ' ' + 'Continuation '.repeat(30) + '.';
		const project: Project = { ...projectFactory.build(), oneLiner: { en: 'Tiny.' }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph', data: { text } }] } } };
		expect(projectCopy(project, locale, { en: 'Site default' }).description).toBe('Site default');
	});

	it.each(['e.g. examples', 'i.e. examples', 'p. ex. les horaires', 'p. ej. los horarios', 'Dr.', 'M.', 'Mme.', 'Sr.', 'Sra.', 'núm.', 'env. examples', 'Dre.', 'Dra.', 'Inc. offices', 'Ltd. offices', 'Co. offices', 'Corp. offices', 'Mmes.', 'Mlle.', 'Sres.', 'Lic.', 'Ing.', 'av.', 'p.'])(
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
	it.each([
		['en', 'This project provides timely service updates for route No. 24, helping commuters'],
		['fr', 'Ce projet fournit des informations utiles aux voyageurs sur le boul. Saint-Laurent'],
		['es', 'Este proyecto ofrece información útil para todos los viajeros en la pág. 24'],
		['en', 'This project records useful service updates at 9.30 a.m. with observations'],
		['en', 'This project shares useful updates for commuters via example.com and version 2.4'],
		['en', 'This project catalogues books written by J\u030c.R.R. Tolkien'],
	] as const)('rejects %s false boundaries with a long one-liner', (locale, prefix) => {
		for (const first of ['', 'This project gives every website a consistent visual language. ']) {
			const text = first + prefix + ' ' + 'continued observations '.repeat(20) + '.';
			const project: Project = { ...projectFactory.build(), oneLiner: { en: 'Long project summary '.repeat(11).trim() }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph', data: { text } }] } } };
			expect(project.oneLiner.en).toHaveLength(230);
			expect(projectCopy(project, locale, { en: 'Site default' }).description).toBe(first ? withShareCta(first.trim(), SHARE_CTA.project.label[locale]) : 'Site default');
		}
	});
	it.each(['Dr', 'Dre', 'Dra', 'Pr', 'Prof', 'M', 'Mme', 'Mmes', 'Mlle', 'Mr', 'Mrs', 'Ms', 'Sr', 'Sra', 'Sres', 'Srta', 'St', 'Ste', 'No', 'Nº', 'núm', 'boul', 'av', 'ave', 'blvd', 'ch', 'pág', 'p', 'vol', 'fig', 'Lic', 'Ing', 'J.R.R', 'J\u030c', 'U.S', 'e.g', 'i.e', 'p. ex', 'p. ej'])(
		'protects %s before uppercase continuations but accepts it at end of text', (prefix) => {
			const sentence = `This project shares useful service observations with ${prefix}.`;
			const project = projectFactory.build({ oneLiner: { en: 'Tiny.' }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph', data: { text: sentence } }] } } });
			expect(projectCopy(project, 'en', { en: 'Site default' }).description).toBe(withShareCta(sentence, SHARE_CTA.project.label.en));
			const continued = { ...project, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph' as const, data: { text: sentence + ' Continuation '.repeat(30) + '.' } }] } } };
			expect(projectCopy(continued, 'en', { en: 'Site default' }).description).toBe('Site default');
		},
	);
	it.each(['Inc.', 'Ltd.', 'Co.', 'Corp.', 'etc.', 'a.m.', 'p.m.'])(
		'accepts %s before a new uppercase sentence', (suffix) => {
			const first = `This project gives local teams reliable and timely service updates from Acme ${suffix}`;
			if (suffix === 'Inc.') expect(first).toHaveLength(81);
			const text = first + ' It helps commuters ' + 'plan their daily journeys '.repeat(20) + '.';
			const project = projectFactory.build({ oneLiner: { en: 'Tiny.' }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph', data: { text } }] } } });
			expect(projectCopy(project, 'en', { en: 'Site default' }).description).toBe(withShareCta(first, SHARE_CTA.project.label.en));
		},
	);
	it.each(['.', '!', '?', '…', '...', '. »', '!"', '?]', '…)', '...’', '.}'])(
		'uses the same continuation rule after %s', (ending) => {
			const first = `This project provides useful service updates for local commuters${ending}`;
			for (const next of ['lowercase', '24', 'Uppercase', '¿Question', '¡Exclamation', '«Quote', '"Quote', '“Quote', '‘Quote', '(Aside', '[Aside']) {
				const text = first + ' ' + next + ' continued observations'.repeat(30) + '.';
				const project = projectFactory.build({ oneLiner: { en: 'Tiny.' }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph', data: { text } }] } } });
				expect(projectCopy(project, 'en', { en: 'Site default' }).description).toBe(['lowercase', '24'].includes(next) ? 'Site default' : withShareCta(first, SHARE_CTA.project.label.en));
			}
		},
	);
	it.each([
		['en', 'To help local commuters answer “Where is my bus? Is it running late?”, this dashboard combines live vehicle positions with historical arrival data'],
		['fr', 'Pour aider les usagers à répondre à « Où est mon autobus? Est-il en retard? », ce tableau de bord combine les positions en direct et l’historique'],
		['es', 'Para ayudar a responder «¿Dónde está mi autobús? ¿Llega tarde?», este panel combina las posiciones en vivo con el historial de llegadas'],
		['en', 'This project connects the tools small teams already use (Where does each figure come from? Which system wins?) and keeps every source traceable'],
	] as const)('never ends a %s sentence inside an open quotation or bracket', (locale, opening) => {
		for (const first of ['', 'This project gives every website a consistent visual language. ']) {
			const text = first + opening + ' ' + 'with continued observations '.repeat(10) + '.';
			const project: Project = { ...projectFactory.build(), oneLiner: { en: 'Long project summary '.repeat(11).trim() }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph', data: { text } }] } } };
			expect(projectCopy(project, locale, { en: 'Site default' }).description).toBe(first ? withShareCta(first.trim(), SHARE_CTA.project.label[locale]) : 'Site default');
		}
	});
	it.each([
		['en', 'This project connects the tools that small teams already use, e.g. Google Analytics for traffic reports'],
		['en', 'This project keeps one reporting source for each figure, i.e. Shopify for customer orders'],
		['fr', 'Ce projet relie les outils que les petites équipes utilisent déjà, p. ex. Google Analytics pour le trafic'],
		['es', 'Este proyecto conecta las herramientas que los equipos ya usan, p. ej. Google Analytics para el tráfico'],
	] as const)('keeps a %s example introducer with its proper-name complement', (locale, opening) => {
		for (const first of ['', 'This project gives every website a consistent visual language. ']) {
			const text = first + opening + ', ' + 'Stripe for payments and more '.repeat(10) + '.';
			const project: Project = { ...projectFactory.build(), oneLiner: { en: 'Long project summary '.repeat(11).trim() }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph', data: { text } }] } } };
			expect(projectCopy(project, locale, { en: 'Site default' }).description).toBe(first ? withShareCta(first.trim(), SHARE_CTA.project.label[locale]) : 'Site default');
		}
	});
	it('closes a sentence after a complete quotation', () => {
		const first = 'Riders kept asking “Where is my bus? Is it late?” and this project answers both.';
		const text = first + ' It ' + 'adds observations '.repeat(20) + '.';
		const project = projectFactory.build({ oneLiner: { en: 'Tiny.' }, description: { en: { time: 1, version: '2.31.2', blocks: [{ id: 'overview', type: 'paragraph', data: { text } }] } } });
		expect(projectCopy(project, 'en', { en: 'Site default' }).description).toBe(withShareCta(first, SHARE_CTA.project.label.en));
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
