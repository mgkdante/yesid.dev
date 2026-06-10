import { describe, it, expect } from 'bun:test';
import { extractText, BlockEditorDocSchema } from '@repo/shared';
import {
	loadTechStackFixture,
	toTechStackRow,
	toTranslationRows,
	toServiceJunctionRows,
	toProjectJunctionRows,
	type TechStackFixture,
} from '../scripts/seed-tech-stack';

describe('seed-tech-stack pure helpers', () => {
	const fixture = loadTechStackFixture();
	const airflow = fixture.find((i) => i.id === 'airflow')!;
	const cpp = fixture.find((i) => i.id === 'cpp')!;
	const threejsThrelte = fixture.find((i) => i.id === 'threejs-threlte')!;

	describe('loadTechStackFixture', () => {
		it('returns 34 entries', () => {
			expect(fixture.length).toBe(34);
		});

		it('first entry sorted by id is airflow', () => {
			const sorted = [...fixture].sort((a, b) => a.id.localeCompare(b.id));
			expect(sorted[0]!.id).toBe('airflow');
		});

		it('every entry passes Zod (no throw during load)', () => {
			// loadTechStackFixture() throws on Zod failure — reaching here means all 34 pass.
			expect(fixture.length).toBeGreaterThan(0);
		});

		it('airflow entry has expected shape', () => {
			expect(airflow).toBeDefined();
			expect(airflow.name).toBe('Apache Airflow');
			expect(airflow.status).toBe('published');
			expect(airflow.lang).toBe('en');
		});
	});

	describe('toTechStackRow', () => {
		// slice-28.5 (#32): parent row writes icon_id (M2O FK into icons) — the
		// legacy `icon` string field was dropped from the schema in 18h-ii.
		it('returns flat parent shape — no translation or junction fields', () => {
			const row = toTechStackRow(airflow);
			expect(Object.keys(row).sort()).toEqual(
				['id', 'icon_id', 'name', 'sort', 'status'].sort(),
			);
		});

		it('preserves id, name, icon_id, status, sort', () => {
			const row = toTechStackRow(airflow);
			expect(row.id).toBe('airflow');
			expect(row.name).toBe('Apache Airflow');
			expect(row.icon_id).toBe('airflow');
			expect(row.status).toBe('published');
			expect(row.sort).toBe(1);
		});

		it('strips translation + junction data', () => {
			const row = toTechStackRow(airflow) as unknown as Record<string, unknown>;
			expect(row['translation']).toBeUndefined();
			expect(row['related_services']).toBeUndefined();
			expect(row['related_projects']).toBeUndefined();
		});

		it('handles cpp with empty icon correctly', () => {
			const row = toTechStackRow(cpp);
			expect(row.id).toBe('cpp');
			expect(row.name).toBe('C++');
			expect(row.icon_id).toBe('cpp');
			expect(row.sort).toBe(4);
		});
	});

	describe('toTranslationRows', () => {
		it('returns exactly 1 row for mono-locale en fixture', () => {
			const rows = toTranslationRows(airflow);
			expect(rows.length).toBe(1);
		});

		it('sets tech_stack_id as FK to parent', () => {
			const rows = toTranslationRows(airflow);
			expect(rows[0]!.tech_stack_id).toBe('airflow');
		});

		it('sets languages_code to en', () => {
			const rows = toTranslationRows(airflow);
			expect(rows[0]!.languages_code).toBe('en');
		});

		it('has all 3 Block Editor doc fields populated', () => {
			const row = toTranslationRows(airflow)[0]!;
			expect(row.what_it_is).toBeDefined();
			expect(row.what_i_use_it_for).toBeDefined();
			expect(row.why_i_use_it_instead).toBeDefined();
		});

		it('what_it_is has expected version + blocks', () => {
			const row = toTranslationRows(airflow)[0]!;
			expect(row.what_it_is.version).toBe('2.31.2');
			expect(row.what_it_is.blocks.length).toBeGreaterThan(0);
		});

		it('spot-checks airflow what_it_is text via extractText', () => {
			const row = toTranslationRows(airflow)[0]!;
			const text = extractText(row.what_it_is);
			expect(text).toContain('Airflow');
		});

		it('spot-checks airflow why_i_use_it_instead text via extractText', () => {
			const row = toTranslationRows(airflow)[0]!;
			const text = extractText(row.why_i_use_it_instead);
			expect(text.length).toBeGreaterThan(0);
		});

		it('threejs-threlte why_i_use_it_instead contains expected content', () => {
			const row = toTranslationRows(threejsThrelte)[0]!;
			const text = extractText(row.why_i_use_it_instead);
			expect(text).toContain('Three.js');
		});
	});

	describe('toServiceJunctionRows', () => {
		it('returns 1 row for airflow (related_services: ["data-pipeline"])', () => {
			const rows = toServiceJunctionRows(airflow);
			expect(rows.length).toBe(1);
			expect(rows[0]).toEqual({ tech_stack_id: 'airflow', services_id: 'data-pipeline' });
		});

		it('returns empty array for cpp (no related_services)', () => {
			const rows = toServiceJunctionRows(cpp);
			expect(rows.length).toBe(0);
		});

		it('uses item id as tech_stack_id FK', () => {
			const rows = toServiceJunctionRows(airflow);
			expect(rows[0]!.tech_stack_id).toBe('airflow');
		});

		it('emits empty array when passed an item with empty related_services', () => {
			const empty: TechStackFixture = { ...airflow, related_services: [] };
			expect(toServiceJunctionRows(empty)).toEqual([]);
		});
	});

	describe('toProjectJunctionRows', () => {
		it('returns 1 row for airflow (related_projects: ["transit-data-pipeline"])', () => {
			const rows = toProjectJunctionRows(airflow);
			expect(rows.length).toBe(1);
			expect(rows[0]).toEqual({
				tech_stack_id: 'airflow',
				projects_id: 'transit-data-pipeline',
			});
		});

		it('returns empty array for threejs-threlte (no related_projects)', () => {
			const rows = toProjectJunctionRows(threejsThrelte);
			expect(rows.length).toBe(0);
		});

		it('returns empty array for cpp (no related_projects)', () => {
			expect(toProjectJunctionRows(cpp).length).toBe(0);
		});
	});

	describe('BlockEditorDoc validation', () => {
		it('airflow what_it_is passes BlockEditorDocSchema', () => {
			expect(
				BlockEditorDocSchema.safeParse(airflow.translation.what_it_is).success,
			).toBe(true);
		});

		it('airflow what_i_use_it_for passes BlockEditorDocSchema', () => {
			expect(
				BlockEditorDocSchema.safeParse(airflow.translation.what_i_use_it_for).success,
			).toBe(true);
		});

		it('threejs-threlte why_i_use_it_instead passes BlockEditorDocSchema', () => {
			expect(
				BlockEditorDocSchema.safeParse(threejsThrelte.translation.why_i_use_it_instead).success,
			).toBe(true);
		});

		it('cpp all 3 body fields pass BlockEditorDocSchema', () => {
			for (const field of ['what_it_is', 'what_i_use_it_for', 'why_i_use_it_instead'] as const) {
				expect(
					BlockEditorDocSchema.safeParse(cpp.translation[field]).success,
				).toBe(true);
			}
		});
	});
});
