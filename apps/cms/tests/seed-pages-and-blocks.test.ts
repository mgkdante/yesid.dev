import { describe, it, expect } from 'bun:test';
import {
	toPageRows,
	toBlockHeroRow,
	toBlockHeroTranslationRows,
	toBlockManifestoRow,
	toBlockManifestoTranslationRows,
	toBlockProofReelRow,
	toBlockProofReelTranslationRows,
	toBlockServicesGridRow,
	toBlockServicesGridTranslationRows,
	toBlockAboutIntroRow,
	toBlockAboutIntroTranslationRows,
	toBlockCtaRow,
	toBlockCtaTranslationRows,
	toBlockCloserRow,
	toBlockCloserTranslationRows,
	toBlockAboutContentRow,
	toBlockAboutContentTranslationRows,
	toBlockContactContentRow,
	toBlockContactContentTranslationRows,
	toBlockTechStackPageContentRow,
	toBlockTechStackPageContentTranslationRows,
	toBlockProjectsPageContentRow,
	toBlockProjectsPageContentTranslationRows,
	toBlockBlogPageContentRow,
	toBlockBlogPageContentTranslationRows,
	toNavLinkRows,
	toErrorPageRows,
	toM2AJunctionShapes,
	validateAllFixtures,
	NAV_PLACEMENTS,
	type DirectusBlockParentRow,
	type DirectusNavLinkRow,
	type DirectusErrorPageRow,
} from '../scripts/seed-pages-and-blocks';

// ---------------------------------------------------------------------------
// Fixture imports (same path as seed script uses)
// ---------------------------------------------------------------------------

import siteContentFixture from '../fixtures/content/site-content.json' with { type: 'json' };
import aboutPageFixture from '../fixtures/content/about-page.json' with { type: 'json' };
import contactPageFixture from '../fixtures/content/contact-page.json' with { type: 'json' };
import navFixture from '../fixtures/content/nav.json' with { type: 'json' };
import techStackPageFixture from '../fixtures/content/tech-stack-page.json' with { type: 'json' };

// ---------------------------------------------------------------------------
// toPageRows
// ---------------------------------------------------------------------------

describe('toPageRows', () => {
	const rows = toPageRows();

	it('returns exactly 7 rows', () => {
		expect(rows.length).toBe(7);
	});

	it('includes all 7 expected slugs', () => {
		const slugs = rows.map((r) => r.slug).sort();
		expect(slugs).toEqual(['about', 'blog', 'contact', 'home', 'projects', 'services', 'tech-stack']);
	});

	it('all rows are published', () => {
		expect(rows.every((r) => r.status === 'published')).toBe(true);
	});

	it('sort values are unique and start at 1', () => {
		const sorts = rows.map((r) => r.sort).sort((a, b) => a - b);
		expect(sorts[0]).toBe(1);
		expect(new Set(sorts).size).toBe(7);
	});

	it('home has sort 1', () => {
		const home = rows.find((r) => r.slug === 'home');
		expect(home?.sort).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// block_hero
// ---------------------------------------------------------------------------

describe('toBlockHeroRow', () => {
	it('has correct editor_label', () => {
		expect(toBlockHeroRow().editor_label).toBe('Home Hero');
	});

	it('is published', () => {
		expect(toBlockHeroRow().status).toBe('published');
	});

	it('sort defaults to 1', () => {
		expect(toBlockHeroRow().sort).toBe(1);
	});
});

describe('toBlockHeroTranslationRows', () => {
	const rows = toBlockHeroTranslationRows(siteContentFixture);

	it('returns 1 translation row (en only in fixture)', () => {
		expect(rows.length).toBe(1);
	});

	it('languages_code is en', () => {
		expect(rows[0]?.languages_code).toBe('en');
	});

	it('headline is a nested JSON object with line1/line2/ariaSuffix', () => {
		const h = rows[0]?.headline as Record<string, unknown>;
		expect(h).toBeDefined();
		expect(typeof h?.['line1']).toBe('string');
		expect(typeof h?.['line2']).toBe('string');
		expect(typeof h?.['ariaSuffix']).toBe('string');
	});

	it('subheadline is a bare string', () => {
		expect(typeof rows[0]?.subheadline).toBe('string');
	});

	it('sql_panel is a nested JSON object', () => {
		const sp = rows[0]?.sql_panel as Record<string, unknown>;
		expect(sp).toBeDefined();
		expect(typeof sp?.['prompt']).toBe('string');
	});
});

// ---------------------------------------------------------------------------
// block_manifesto
// ---------------------------------------------------------------------------

describe('toBlockManifestoRow', () => {
	const row = toBlockManifestoRow(siteContentFixture);

	it('has correct editor_label', () => {
		expect(row.editor_label).toBe('Home Manifesto');
	});

	it('sort defaults to 2', () => {
		expect(row.sort).toBe(2);
	});

	it('exposes ticks as non-translatable JSON column on parent', () => {
		expect(Array.isArray(row.ticks)).toBe(true);
		expect((row.ticks as readonly string[]).length).toBe(7);
		expect((row.ticks as readonly string[])[0]).toBe('0');
	});
});

describe('toBlockManifestoTranslationRows', () => {
	const rows = toBlockManifestoTranslationRows(siteContentFixture);

	it('returns 1 row', () => {
		expect(rows.length).toBe(1);
	});

	it('statement is a nested JSON object', () => {
		const s = rows[0]?.statement as Record<string, unknown>;
		expect(s?.['line1']).toBe('I BUILD THE');
		expect(s?.['lineHuge']).toBe('INFRASTRUCTURE');
	});

	it('pills is an array of label/serviceId pairs', () => {
		const pills = rows[0]?.pills as Array<{ label: string; serviceId: string }>;
		expect(Array.isArray(pills)).toBe(true);
		expect(pills.length).toBe(5);
		expect(pills[0]?.serviceId).toBe('data-pipeline');
	});

	it('hidden_transit_lines has 9 entries', () => {
		const lines = rows[0]?.hidden_transit_lines as unknown[];
		expect(lines.length).toBe(9);
	});
});

// ---------------------------------------------------------------------------
// block_proof_reel
// ---------------------------------------------------------------------------

describe('toBlockProofReelRow', () => {
	const row = toBlockProofReelRow(siteContentFixture);

	it('has correct editor_label and sort 3', () => {
		expect(row.editor_label).toBe('Home Proof Reel');
		expect(row.sort).toBe(3);
	});

	it('exposes view_all_href, slugs, and images JSON columns on parent', () => {
		expect(typeof row.view_all_href).toBe('string');
		expect(Array.isArray(row.slugs)).toBe(true);
		expect((row.slugs as readonly string[]).length).toBeGreaterThan(0);
		expect(typeof row.images).toBe('object');
		const images = row.images as Record<string, string>;
		const slugs = row.slugs as readonly string[];
		// every slug has a corresponding image entry
		for (const s of slugs) {
			expect(typeof images[s]).toBe('string');
		}
	});
});

describe('toBlockProofReelTranslationRows', () => {
	const rows = toBlockProofReelTranslationRows(siteContentFixture);
	it('returns 1 row with heading string', () => {
		expect(rows.length).toBe(1);
		expect(rows[0]?.heading).toBe('PROOF');
	});
});

// ---------------------------------------------------------------------------
// block_services_grid
// ---------------------------------------------------------------------------

describe('toBlockServicesGridRow', () => {
	it('has correct editor_label and sort 4', () => {
		const row = toBlockServicesGridRow();
		expect(row.editor_label).toBe('Home Services Grid');
		expect(row.sort).toBe(4);
	});
});

describe('toBlockServicesGridTranslationRows', () => {
	const rows = toBlockServicesGridTranslationRows(siteContentFixture);
	it('returns 1 row with heading string', () => {
		expect(rows.length).toBe(1);
		expect(rows[0]?.heading).toBe('SERVICES');
	});
});

// ---------------------------------------------------------------------------
// block_about_intro
// ---------------------------------------------------------------------------

describe('toBlockAboutIntroRow', () => {
	it('has correct editor_label and sort 5', () => {
		const row = toBlockAboutIntroRow();
		expect(row.editor_label).toBe('Home About Intro');
		expect(row.sort).toBe(5);
	});
});

describe('toBlockAboutIntroTranslationRows', () => {
	const rows = toBlockAboutIntroTranslationRows(siteContentFixture);
	it('location is a nested object with city/region as bare strings', () => {
		const loc = rows[0]?.location as Record<string, unknown>;
		expect(typeof loc?.['city']).toBe('string');
		expect(typeof loc?.['region']).toBe('string');
	});
});

// ---------------------------------------------------------------------------
// block_cta
// ---------------------------------------------------------------------------

describe('toBlockCtaRow', () => {
	it('has correct editor_label and sort 6', () => {
		const row = toBlockCtaRow();
		expect(row.editor_label).toBe('Home CTA');
		expect(row.sort).toBe(6);
	});
});

describe('toBlockCtaTranslationRows', () => {
	const rows = toBlockCtaTranslationRows(siteContentFixture);
	it('heading and subtitle are bare strings', () => {
		expect(typeof rows[0]?.heading).toBe('string');
		expect(typeof rows[0]?.subtitle).toBe('string');
	});
});

// ---------------------------------------------------------------------------
// block_closer
// ---------------------------------------------------------------------------

describe('toBlockCloserRow', () => {
	it('has correct editor_label and sort 7', () => {
		const row = toBlockCloserRow();
		expect(row.editor_label).toBe('Home Closer');
		expect(row.sort).toBe(7);
	});
});

describe('toBlockCloserTranslationRows', () => {
	const rows = toBlockCloserTranslationRows(siteContentFixture);
	it('rows is a nested object with contact/connect/read/about', () => {
		const r = rows[0]?.rows as Record<string, unknown>;
		expect(r?.['contact']).toBeDefined();
		expect(r?.['read']).toBeDefined();
	});

	it('terminal has title/city bare strings', () => {
		const t = rows[0]?.terminal as Record<string, unknown>;
		expect(typeof t?.['title']).toBe('string');
		expect(typeof t?.['city']).toBe('string');
	});
});

// ---------------------------------------------------------------------------
// block_about_content (has non-translatable parent fields)
// ---------------------------------------------------------------------------

describe('toBlockAboutContentRow', () => {
	const row = toBlockAboutContentRow(aboutPageFixture);

	it('has correct editor_label', () => {
		expect(row.editor_label).toBe('About Content');
	});

	it('tech_stack is an array on the parent row (non-translatable)', () => {
		expect(Array.isArray(row.tech_stack)).toBe(true);
		expect((row.tech_stack as unknown[]).length).toBeGreaterThan(0);
	});

	it('client_count is a number on the parent row', () => {
		expect(typeof row.client_count).toBe('number');
		expect(row.client_count).toBe(10);
	});

	it('client_logos is an array on the parent row', () => {
		expect(Array.isArray(row.client_logos)).toBe(true);
	});
});

describe('toBlockAboutContentTranslationRows', () => {
	const rows = toBlockAboutContentTranslationRows(aboutPageFixture);

	it('returns 1 translation row', () => {
		expect(rows.length).toBe(1);
	});

	it('identity has name/title as bare strings', () => {
		const id = rows[0]?.identity as Record<string, unknown>;
		expect(typeof id?.['name']).toBe('string');
		expect(typeof id?.['title']).toBe('string');
	});

	it('metrics are an array with value/label pairs', () => {
		const metrics = rows[0]?.metrics as Array<{ value: string; label: string }>;
		expect(Array.isArray(metrics)).toBe(true);
		expect(metrics.length).toBe(4);
		expect(metrics[0]?.value).toBe('5+');
		expect(typeof metrics[0]?.label).toBe('string');
	});

	it('stop_labels has all 10 keys', () => {
		const sl = rows[0]?.stop_labels as Record<string, unknown>;
		const keys = Object.keys(sl);
		expect(keys.length).toBe(10);
	});
});

// ---------------------------------------------------------------------------
// block_contact_content
// ---------------------------------------------------------------------------

describe('toBlockContactContentRow', () => {
	const row = toBlockContactContentRow(contactPageFixture);

	it('has correct editor_label', () => {
		expect(row.editor_label).toBe('Contact Content');
	});

	it('exposes web3forms_key as non-translatable parent column', () => {
		expect(typeof row.web3forms_key).toBe('string');
		expect(row.web3forms_key).toBe(contactPageFixture.web3formsKey);
	});
});

describe('toBlockContactContentTranslationRows', () => {
	const rows = toBlockContactContentTranslationRows(contactPageFixture);
	it('page_title is a bare string', () => {
		expect(typeof rows[0]?.page_title).toBe('string');
		expect(rows[0]?.page_title).toBe('Contact');
	});

	it('form_terminal.fields has name/email/message', () => {
		const ft = rows[0]?.form_terminal as Record<string, unknown>;
		const fields = ft?.['fields'] as Record<string, unknown>;
		expect(fields?.['name']).toBeDefined();
		expect(fields?.['email']).toBeDefined();
		expect(fields?.['message']).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// block_tech_stack_page_content
// ---------------------------------------------------------------------------

describe('toBlockTechStackPageContentRow', () => {
	it('has correct editor_label', () => {
		expect(toBlockTechStackPageContentRow().editor_label).toBe('Tech Stack Page Content');
	});
});

describe('toBlockTechStackPageContentTranslationRows', () => {
	const rows = toBlockTechStackPageContentTranslationRows(techStackPageFixture);
	it('hero.titleLine1 is "The Control"', () => {
		const hero = rows[0]?.hero as Record<string, unknown>;
		expect(hero?.['titleLine1']).toBe('The Control');
	});
});

// ---------------------------------------------------------------------------
// block_projects_page_content + block_blog_page_content (stubs)
// ---------------------------------------------------------------------------

describe('toBlockProjectsPageContentRow', () => {
	it('has correct editor_label', () => {
		expect(toBlockProjectsPageContentRow().editor_label).toBe('Projects Page Content');
	});
});

describe('toBlockProjectsPageContentTranslationRows', () => {
	const rows = toBlockProjectsPageContentTranslationRows();
	it('returns 1 row with intro as bare string', () => {
		expect(rows.length).toBe(1);
		// slice-27.1 T4: `intro` is a FLAT string column (type=string,
		// interface=input). The seed writes a bare string; the fetcher/adapter
		// wrap it into `{ en }` downstream. Writing an object here re-introduces
		// the double-encoding bug (serialized literal `{"en":"…"}`).
		expect(typeof rows[0]?.intro).toBe('string');
	});
});

describe('toBlockBlogPageContentRow', () => {
	it('has correct editor_label', () => {
		expect(toBlockBlogPageContentRow().editor_label).toBe('Blog Page Content');
	});
});

describe('toBlockBlogPageContentTranslationRows', () => {
	const rows = toBlockBlogPageContentTranslationRows();
	it('returns 1 row with intro', () => {
		expect(rows.length).toBe(1);
		expect(rows[0]?.intro).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// toNavLinkRows — placement coverage
// ---------------------------------------------------------------------------

describe('toNavLinkRows', () => {
	const rows = toNavLinkRows(navFixture);

	it('produces rows for all 4 placements', () => {
		for (const placement of NAV_PLACEMENTS) {
			const found = rows.filter((r) => r.placement === placement);
			expect(found.length).toBeGreaterThan(0);
		}
	});

	it('header has 3 links (Services, Projects, Stack)', () => {
		const header = rows.filter((r) => r.placement === 'header');
		expect(header.length).toBe(3);
	});

	it('footer has 3 links (Contact, About, Blog)', () => {
		const footer = rows.filter((r) => r.placement === 'footer');
		expect(footer.length).toBe(3);
		const hrefs = footer.map((r) => r.href).sort();
		expect(hrefs).toEqual(['/about', '/blog', '/contact'].sort());
	});

	it('mobile has 3 links (same as header)', () => {
		const mobile = rows.filter((r) => r.placement === 'mobile');
		expect(mobile.length).toBe(3);
	});

	it('menu has 6 links (all menuItems)', () => {
		const menu = rows.filter((r) => r.placement === 'menu');
		expect(menu.length).toBe(6);
	});

	it('menu links include subtitle in translations where available', () => {
		const menuServices = rows.find((r) => r.placement === 'menu' && r.href === '/services');
		expect(menuServices).toBeDefined();
		const enTranslation = menuServices?.translations.find((t) => t.languages_code === 'en');
		expect(enTranslation?.subtitle).toBeDefined();
		expect(typeof enTranslation?.subtitle).toBe('string');
	});

	it('all rows are published', () => {
		expect(rows.every((r) => r.status === 'published')).toBe(true);
	});

	it('header rows have priority 1 or 2', () => {
		const header = rows.filter((r) => r.placement === 'header');
		for (const row of header) {
			expect([1, 2]).toContain(row.priority);
		}
	});

	it('multilingual nav_links include fr and es translations', () => {
		const headerServices = rows.find((r) => r.placement === 'header' && r.href === '/services');
		expect(headerServices).toBeDefined();
		const locales = headerServices!.translations.map((t) => t.languages_code).sort();
		expect(locales).toContain('en');
		expect(locales).toContain('fr');
		expect(locales).toContain('es');
	});
});

// ---------------------------------------------------------------------------
// toErrorPageRows
// ---------------------------------------------------------------------------

describe('toErrorPageRows', () => {
	const rows = toErrorPageRows(navFixture);

	it('returns exactly 3 rows', () => {
		expect(rows.length).toBe(3);
	});

	it('includes status_code 404, 500, and 0', () => {
		const codes = rows.map((r) => r.status_code).sort((a, b) => a - b);
		expect(codes).toEqual([0, 404, 500]);
	});

	it('all rows are published', () => {
		expect(rows.every((r) => r.status === 'published')).toBe(true);
	});

	it('404 row has en translation with correct label', () => {
		const row404 = rows.find((r) => r.status_code === 404)!;
		const en = row404.translations.find((t) => t.languages_code === 'en')!;
		expect(en.label).toBe('ROUTE NOT FOUND');
		expect(typeof en.heading).toBe('string');
		expect(typeof en.description).toBe('string');
		expect(typeof en.terminal_line).toBe('string');
	});

	it('404 row has multilingual translations (en, fr, es)', () => {
		const row404 = rows.find((r) => r.status_code === 404)!;
		const locales = row404.translations.map((t) => t.languages_code).sort();
		expect(locales).toContain('en');
		expect(locales).toContain('fr');
		expect(locales).toContain('es');
	});

	it('500 row has en translation', () => {
		const row500 = rows.find((r) => r.status_code === 500)!;
		const en = row500.translations.find((t) => t.languages_code === 'en')!;
		expect(en).toBeDefined();
		expect(typeof en.heading).toBe('string');
	});

	it('0 (generic fallback) row has en translation', () => {
		const row0 = rows.find((r) => r.status_code === 0)!;
		const en = row0.translations.find((t) => t.languages_code === 'en')!;
		expect(en).toBeDefined();
	});

	it('404 suggestions are an array with label/href pairs', () => {
		const row404 = rows.find((r) => r.status_code === 404)!;
		const en = row404.translations.find((t) => t.languages_code === 'en')!;
		expect(Array.isArray(en.suggestions)).toBe(true);
		expect(en.suggestions.length).toBeGreaterThan(0);
		const first = en.suggestions[0]!;
		expect(typeof first.label).toBe('string');
		expect(typeof first.href).toBe('string');
	});
});

// ---------------------------------------------------------------------------
// toM2AJunctionShapes
// ---------------------------------------------------------------------------

describe('toM2AJunctionShapes', () => {
	const shapes = toM2AJunctionShapes();

	it('returns 12 junction shapes', () => {
		expect(shapes.length).toBe(12);
	});

	it('home page has 7 blocks wired', () => {
		const homeShapes = shapes.filter((s) => s.pages_id === 'home');
		expect(homeShapes.length).toBe(7);
	});

	it('every non-home page has exactly 1 block wired', () => {
		const pages = ['about', 'contact', 'tech-stack', 'projects', 'blog'];
		for (const page of pages) {
			const found = shapes.filter((s) => s.pages_id === page);
			expect(found.length).toBe(1);
		}
	});

	it('no block_journey_panel references', () => {
		const hasJourney = shapes.some((s) => s.collection.includes('journey_panel'));
		expect(hasJourney).toBe(false);
	});

	it('no services page (it has 0 blocks)', () => {
		const servicesShapes = shapes.filter((s) => s.pages_id === 'services');
		expect(servicesShapes.length).toBe(0);
	});

	it('all collection names are valid block_ collections', () => {
		const valid = new Set([
			'block_hero', 'block_manifesto', 'block_proof_reel', 'block_services_grid',
			'block_about_intro', 'block_cta', 'block_closer', 'block_about_content',
			'block_contact_content', 'block_tech_stack_page_content',
			'block_projects_page_content', 'block_blog_page_content',
		]);
		for (const shape of shapes) {
			expect(valid.has(shape.collection)).toBe(true);
		}
	});
});

// ---------------------------------------------------------------------------
// validateAllFixtures (integration — all Zod schemas pass)
// ---------------------------------------------------------------------------

describe('validateAllFixtures', () => {
	it('passes without throwing (all @repo/shared schemas accept fixture data)', () => {
		expect(() => validateAllFixtures()).not.toThrow();
	});
});
