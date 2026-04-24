import { describe, expect, it } from 'bun:test';
import { ServicesFixtureSchema, loadServicesFixture } from '../scripts/seed-services';

/**
 * Fixture shape assertion — `fixtures/collections/services.json` must parse against the
 * Zod schema authored alongside the seed script. If either side drifts, the
 * test catches it before the seed script is run.
 *
 * Scope: repo-local. No network. No Directus. Just the fixture + Zod.
 */
describe('fixtures/collections/services.json', () => {
	it('parses against ServicesFixtureSchema (no silent drift)', () => {
		expect(() => loadServicesFixture()).not.toThrow();
	});

	it('contains at least 6 services (matches the yesid.dev catalog)', () => {
		const services = loadServicesFixture();
		expect(services.length).toBeGreaterThanOrEqual(6);
	});

	it('has unique ids across the catalog', () => {
		const services = loadServicesFixture();
		const ids = services.map((s) => s.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('has unique station numbers across the catalog', () => {
		const services = loadServicesFixture();
		const stations = services.map((s) => s.station);
		expect(new Set(stations).size).toBe(stations.length);
	});

	it('every service has a non-empty English title + description', () => {
		const services = loadServicesFixture();
		for (const s of services) {
			expect(s.title.en.length).toBeGreaterThan(0);
			expect(s.description.en.length).toBeGreaterThan(0);
		}
	});

	it('rejects fixtures with empty English strings (schema guard)', () => {
		const bad = [
			{
				id: 'foo',
				title: { en: '' },
				description: { en: 'valid' },
				station: 1,
				relatedProjects: [],
			},
		];
		expect(() => ServicesFixtureSchema.parse(bad)).toThrow();
	});

	it('rejects fixtures with missing required fields', () => {
		const bad = [
			{
				id: 'foo',
				title: { en: 'valid' },
				// missing description, station, relatedProjects
			},
		];
		expect(() => ServicesFixtureSchema.parse(bad)).toThrow();
	});
});
