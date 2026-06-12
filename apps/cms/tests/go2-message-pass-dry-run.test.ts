import { describe, it, expect } from 'bun:test';
import {
	MANIFESTO_PILLS,
	EN_TRANSLATION_EDITS,
	SITE_META_TRANSLATION_EDITS,
	PROOF_REEL_PATCH,
	SELF_TITLE,
	parseFlags,
} from '../scripts/go2-message-pass';

describe('message-pass payloads', () => {
	it('manifesto pills are the 4 stations in data-flow order', () => {
		expect(MANIFESTO_PILLS).toEqual([
			{ label: 'databases', serviceId: 'database-engineering' },
			{ label: 'pipelines', serviceId: 'data-pipeline' },
			{ label: 'dashboards', serviceId: 'analytics-reporting' },
			{ label: 'websites', serviceId: 'web-development' },
		]);
	});

	it('one self-title everywhere', () => {
		expect(SELF_TITLE).toBe('Freelance Digital Infrastructure Engineer');
		const aboutIntro = EN_TRANSLATION_EDITS.find((e) => e.collection === 'block_about_intro');
		expect(aboutIntro?.fields.title).toBe(SELF_TITLE);
		expect(SITE_META_TRANSLATION_EDITS.en.owner_job_title).toBe(SELF_TITLE);
	});

	it('JSON-column replacements are COMPLETE objects (a partial JSON patch would wipe sibling keys)', () => {
		const techCta = EN_TRANSLATION_EDITS.find(
			(e) => e.collection === 'block_tech_stack_page_content',
		)?.fields.cta as Record<string, unknown>;
		expect(Object.keys(techCta).sort()).toEqual([
			'availability', 'headingLine1', 'headingLine2', 'sub',
		]);
		expect(techCta.availability).toBe('Booking Q3 2026');
		const contactMeta = EN_TRANSLATION_EDITS.find(
			(e) => e.collection === 'block_contact_content',
		)?.fields.meta as Record<string, unknown>;
		expect(Object.keys(contactMeta).sort()).toEqual(['description', 'title']);
	});

	it('vocabulary: no banned phrases in any new copy', () => {
		const allStrings = JSON.stringify({ EN_TRANSLATION_EDITS, SITE_META_TRANSLATION_EDITS });
		expect(allStrings.includes('data engineering')).toBe(false);
		expect(allStrings.includes('Data Engineer')).toBe(false);
		expect(allStrings.includes('SQL developer')).toBe(false);
		expect(allStrings.includes('mobile product')).toBe(false);
		expect(allStrings.includes('internal tooling')).toBe(false);
	});

	it('fr/es site-meta edits touch ONLY owner_job_title (never blank untranslated fields)', () => {
		expect(Object.keys(SITE_META_TRANSLATION_EDITS.fr)).toEqual(['owner_job_title']);
		expect(Object.keys(SITE_META_TRANSLATION_EDITS.es)).toEqual(['owner_job_title']);
	});

	it('proof reel runs on real project slugs only, with an image per slug', () => {
		expect(PROOF_REEL_PATCH.slugs).toEqual(['transit-data-pipeline', 'yesid-dev']);
		expect(PROOF_REEL_PATCH.slugs.some((s) => s.startsWith('lorem-'))).toBe(false);
		expect(Object.keys(PROOF_REEL_PATCH.images).sort()).toEqual([...PROOF_REEL_PATCH.slugs].sort());
		for (const url of Object.values(PROOF_REEL_PATCH.images)) {
			expect(url).toMatch(/^https:\/\//);
		}
	});

	it('only --apply writes', () => {
		expect(parseFlags([]).apply).toBe(false);
		expect(parseFlags(['--apply']).apply).toBe(true);
	});
});
