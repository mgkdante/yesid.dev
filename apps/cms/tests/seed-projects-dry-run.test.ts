import { describe, it, expect } from 'bun:test';
import {
	toProjectRow,
	toTranslationRows,
	toSectionRows,
	toImpactMetricRows,
	toJunctionRows,
	loadProjectsFixture,
	type ProjectFixture,
} from '../scripts/seed-projects';

// Inline fixtures (2026-07-02, pipeline-safety slice): these helper tests used
// to reach into fixtures/collections/projects.json and assert on specific rows
// (including lorem-* ones). Homework #15 made the fixture MIRROR live content,
// so content edits would have broken transform tests that have nothing to do
// with content. The transforms are pure; feed them literals instead.

const FULL: ProjectFixture = {
	id: 'probe-full',
	status: 'published',
	date_published: '2026-01-15',
	sort: 1,
	featured: true,
	// Real key from fixtures/assets-id-map.json so the uuid mapping resolves.
	hero_image_legacy_path: 'images/about/headshot.webp',
	repo_url: 'https://github.com/mgkdante/probe',
	live_url: 'https://probe.example',
	readme_url: null,
	location: 'Montreal',
	environment: 'Production',
	version: '1.0',
	stack: ['SvelteKit', 'TypeScript'],
	tags: ['web', 'probe'],
	translations: [
		{
			languages_code: 'en',
			title: 'Probe Project',
			one_liner: 'A probe.',
			description: 'Built with SvelteKit for probing.',
		},
		{
			languages_code: 'fr',
			title: 'Projet sonde',
			one_liner: 'Une sonde.',
			description: 'Construit avec SvelteKit.',
		},
	],
	sections: [
		{
			sort: 0,
			translations: [
				{ languages_code: 'en', title: 'Why SvelteKit?', content: 'Because it is fast.' },
			],
		},
		{
			sort: 1,
			translations: [{ languages_code: 'en', title: 'Lessons', content: 'Ship small.' }],
		},
	],
	impact_metrics: [
		{
			sort: 0,
			value: '30s',
			before: null,
			translations: [{ languages_code: 'en', label: 'Real-time refresh cycles' }],
		},
		{
			sort: 1,
			value: '2h',
			before: '2 days',
			translations: [{ languages_code: 'en', label: 'Pipeline runtime' }],
		},
	],
	related_services: ['data-pipeline', 'database-engineering'],
};

const BARE: ProjectFixture = {
	...FULL,
	id: 'probe-bare',
	featured: false,
	hero_image_legacy_path: null,
	translations: [FULL.translations[0]!],
	sections: [],
	impact_metrics: [],
	related_services: [],
};

describe('seed-projects pure helpers', () => {
	it('loadProjectsFixture parses the committed fixture (schema-valid, non-empty)', () => {
		const fixture = loadProjectsFixture();
		expect(fixture.length).toBeGreaterThan(0);
	});

	describe('toProjectRow', () => {
		it('preserves id + status + scalar fields', () => {
			const row = toProjectRow(FULL);
			expect(row.id).toBe('probe-full');
			expect(row.status).toBe('published');
			expect(row.featured).toBe(true);
			expect(row.repo_url).toBe('https://github.com/mgkdante/probe');
			expect(row.live_url).toBe('https://probe.example');
			expect(row.stack).toEqual(['SvelteKit', 'TypeScript']);
			expect(row.tags).toEqual(['web', 'probe']);
		});

		it('resolves hero_image when legacy path is in assets-id-map', () => {
			const row = toProjectRow(FULL);
			expect(row.hero_image).toMatch(/^[0-9a-f-]{36}$/i);
		});

		it('returns hero_image: null when legacy path is null', () => {
			const row = toProjectRow(BARE);
			expect(row.hero_image).toBeNull();
		});

		it('flattens nested translations + sections + impact_metrics', () => {
			const row = toProjectRow(FULL);
			expect(row.translations.length).toBe(2);
			expect(row.sections.length).toBe(2);
			expect(row.impact_metrics.length).toBe(2);
		});
	});

	describe('toTranslationRows', () => {
		it('emits one row per translation entry', () => {
			const rows = toTranslationRows(FULL);
			expect(rows.length).toBe(2);
			expect(rows[0].languages_code).toBe('en');
			expect(rows[0].title).toBe('Probe Project');
		});

		it('wraps description as a single-paragraph Editor.js Block Editor doc', () => {
			const rows = toTranslationRows(FULL);
			const en = rows.find((r) => r.languages_code === 'en')!;
			expect(en.description.version).toBe('2.31.2');
			expect(en.description.blocks).toHaveLength(1);
			expect(en.description.blocks[0]!.type).toBe('paragraph');
			expect((en.description.blocks[0] as { data: { text: string } }).data.text).toContain(
				'SvelteKit',
			);
		});
	});

	describe('toSectionRows', () => {
		it('emits one row per section with translations nested', () => {
			const rows = toSectionRows(FULL);
			expect(rows.length).toBe(2);
			expect(rows[0].sort).toBe(0);
			expect(rows[0].translations.length).toBe(1);
			expect(rows[0].translations[0].title).toBe('Why SvelteKit?');
		});

		it('preserves sort order', () => {
			const rows = toSectionRows(FULL);
			expect(rows[0].sort).toBe(0);
			expect(rows[1].sort).toBe(1);
		});

		it('wraps sections.content as Editor.js Block Editor doc', () => {
			const sections = toSectionRows(FULL);
			const tx = sections[0]!.translations[0]!;
			expect(tx.content.version).toBe('2.31.2');
			expect(tx.content.blocks.length).toBeGreaterThan(0);
			expect(tx.content.blocks[0]!.type).toBe('paragraph');
		});
	});

	describe('toImpactMetricRows', () => {
		it('emits one row per metric with translations nested', () => {
			const rows = toImpactMetricRows(FULL);
			expect(rows.length).toBe(2);
			expect(rows[0].value).toBe('30s');
			expect(rows[0].before).toBeNull();
			expect(rows[0].translations[0].label).toBe('Real-time refresh cycles');
		});

		it('preserves before field when set', () => {
			const rows = toImpactMetricRows(FULL);
			expect(rows[1].before).toBe('2 days');
		});
	});

	describe('toJunctionRows', () => {
		it('emits one row per relatedService', () => {
			const rows = toJunctionRows(FULL);
			expect(rows.length).toBe(2);
			expect(rows.map((r) => r.service_id).sort()).toEqual([
				'data-pipeline',
				'database-engineering',
			]);
		});

		it('uses project id as project_id', () => {
			const rows = toJunctionRows(FULL);
			expect(rows[0].project_id).toBe('probe-full');
		});

		it('emits empty array when no related services', () => {
			const rows = toJunctionRows(BARE);
			expect(rows.length).toBe(0);
		});
	});
});
