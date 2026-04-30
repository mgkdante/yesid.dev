import { describe, it, expect } from 'bun:test';
import { extractText } from '@repo/shared';
import {
	toProjectRow,
	toTranslationRows,
	toSectionRows,
	toImpactMetricRows,
	toJunctionRows,
	loadProjectsFixture,
	type ProjectFixture,
} from '../scripts/seed-projects';

describe('seed-projects pure helpers', () => {
	const fixture = loadProjectsFixture();
	const yesidDev = fixture.find((p) => p.id === 'yesid-dev')!;
	const transit = fixture.find((p) => p.id === 'transit-data-pipeline')!;
	const dbMig = fixture.find((p) => p.id === 'lorem-database-migration')!;

	describe('toProjectRow', () => {
		it('preserves id + status + scalar fields', () => {
			const row = toProjectRow(yesidDev);
			expect(row.id).toBe('yesid-dev');
			expect(row.status).toBe('published');
			expect(row.featured).toBe(true);
			expect(row.repo_url).toBe('https://github.com/yesid-dev/yesid.dev');
			expect(row.live_url).toBe('https://yesid.dev');
			expect(row.stack).toEqual(['SvelteKit', 'Svelte 5', 'TypeScript', 'Tailwind CSS', 'Vercel']);
			expect(row.tags).toEqual(['portfolio', 'web', 'svelte']);
		});

		it('resolves hero_image when legacy path is in assets-id-map', () => {
			const row = toProjectRow(yesidDev);
			expect(row.hero_image).toMatch(/^[0-9a-f-]{36}$/i);
		});

		it('returns hero_image: null when legacy path is null', () => {
			const row = toProjectRow(transit);
			expect(row.hero_image).toBeNull();
		});

		it('flattens nested translations + sections + impact_metrics', () => {
			const row = toProjectRow(transit);
			expect(row.translations.length).toBe(1);
			expect(row.sections.length).toBe(0);
			expect(row.impact_metrics.length).toBe(2);
		});
	});

	describe('toTranslationRows', () => {
		it('emits one row per translation entry', () => {
			const rows = toTranslationRows(yesidDev);
			expect(rows.length).toBe(1);
			expect(rows[0].languages_code).toBe('en');
			expect(rows[0].title).toBe('yesid.dev — Portfolio Site');
		});

		it('wraps description as a single-paragraph Editor.js Block Editor doc', () => {
			const rows = toTranslationRows(yesidDev);
			const en = rows.find((r) => r.languages_code === 'en')!;
			expect(en.description.version).toBe('2.31.2');
			expect(en.description.blocks).toHaveLength(1);
			expect(en.description.blocks[0]!.type).toBe('paragraph');
			expect((en.description.blocks[0] as { data: { text: string } }).data.text).toContain('SvelteKit');
		});
	});

	describe('toSectionRows', () => {
		it('emits one row per section with translations nested', () => {
			const rows = toSectionRows(yesidDev);
			expect(rows.length).toBe(1);
			expect(rows[0].sort).toBe(0);
			expect(rows[0].translations.length).toBe(1);
			expect(rows[0].translations[0].title).toBe('Why SvelteKit?');
		});

		it('preserves sort order', () => {
			const rows = toSectionRows(dbMig);
			expect(rows[0].sort).toBe(0);
			expect(rows[1].sort).toBe(1);
		});

		it('wraps sections.content as Editor.js Block Editor doc', () => {
			const sections = toSectionRows(yesidDev);
			if (sections.length > 0) {
				const tx = sections[0]!.translations[0]!;
				expect(tx.content.version).toBe('2.31.2');
				expect(tx.content.blocks.length).toBeGreaterThan(0);
				expect(tx.content.blocks[0]!.type).toBe('paragraph');
			}
		});
	});

	describe('toImpactMetricRows', () => {
		it('emits one row per metric with translations nested', () => {
			const rows = toImpactMetricRows(transit);
			expect(rows.length).toBe(2);
			expect(rows[0].value).toBe('30s');
			expect(rows[0].before).toBeNull();
			expect(rows[0].translations[0].label).toBe('Real-time refresh cycles');
		});

		it('preserves before field when set', () => {
			const lorem = fixture.find((p) => p.id === 'lorem-analytics-dashboard')!;
			const rows = toImpactMetricRows(lorem);
			expect(rows[0].before).toBe('2 days');
		});
	});

	describe('toJunctionRows', () => {
		it('emits one row per relatedService', () => {
			const rows = toJunctionRows(transit);
			expect(rows.length).toBe(2);
			expect(rows.map((r) => r.service_id).sort()).toEqual(['data-pipeline', 'sql-development']);
		});

		it('uses project id as project_id', () => {
			const rows = toJunctionRows(yesidDev);
			expect(rows[0].project_id).toBe('yesid-dev');
		});

		it('emits empty array when no related services', () => {
			const empty: ProjectFixture = { ...yesidDev, related_services: [] };
			const rows = toJunctionRows(empty);
			expect(rows.length).toBe(0);
		});
	});
});
