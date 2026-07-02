import { describe, it, expect } from 'bun:test';
import fixtureData from '../fixtures/collections/projects.json' with { type: 'json' };
import servicesFixtureData from '../fixtures/collections/services.json' with { type: 'json' };
import idMap from '../fixtures/assets-id-map.json' with { type: 'json' };
import { ProjectsFixtureSchema } from '../scripts/seed-projects';

describe('apps/cms/fixtures/collections/projects.json', () => {
	it('parses cleanly through ProjectsFixtureSchema (Zod)', () => {
		const result = ProjectsFixtureSchema.safeParse(fixtureData);
		if (!result.success) {
			console.error(result.error.issues);
		}
		expect(result.success).toBe(true);
	});

	it('mirrors the real roster (Homework #15): case-study hearts present, no lorem', () => {
		const projects = ProjectsFixtureSchema.parse(fixtureData);
		const ids = projects.map((p) => p.id);
		expect(ids).toContain('yesid-dev');
		expect(ids).toContain('transit-data-pipeline');
		expect(ids.filter((id) => id.startsWith('lorem-'))).toEqual([]);
	});

	it('every hero_image_legacy_path (when set) exists in assets-id-map.json', () => {
		const projects = ProjectsFixtureSchema.parse(fixtureData);
		const map = idMap as Record<string, string>;
		for (const p of projects) {
			if (p.hero_image_legacy_path) {
				expect(map[p.hero_image_legacy_path]).toBeTruthy();
			}
		}
	});

	it('every related_services id exists in services fixture', () => {
		const projects = ProjectsFixtureSchema.parse(fixtureData);
		const services = servicesFixtureData as Array<{ id: string }>;
		const serviceIds = new Set(services.map((s) => s.id));
		for (const p of projects) {
			for (const sid of p.related_services) {
				expect(serviceIds.has(sid)).toBe(true);
			}
		}
	});

	it('every project has at least one translation with English', () => {
		const projects = ProjectsFixtureSchema.parse(fixtureData);
		for (const p of projects) {
			const en = p.translations.find((t) => t.languages_code === 'en');
			expect(en).toBeDefined();
			expect((en?.title.length ?? 0)).toBeGreaterThan(0);
		}
	});
});
