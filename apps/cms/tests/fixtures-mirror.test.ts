/**
 * Fixtures mirror real content (Homework #15, 2026-07-01: "mirror. Please
 * delete all lorem work").
 *
 * Disaster recovery used to restore 4 lorem projects and the retired
 * 6-service catalog. scripts/refresh-fixtures.ts now regenerates the fixture
 * JSON from the dev CMS; these hermetic checks (no network) keep the
 * committed fixtures honest in CI:
 *
 *   1. no lorem-* row survives in any of the three refreshed fixtures
 *   2. the visible service catalog is exactly the four current stations
 *   3. every published fixture project also exists in the committed
 *      generated content module (identity cross-check, parsed textually:
 *      that module is GENERATED and stays hands-off)
 *
 * Structure/identity only: content edits (titles, copy, metrics) must not
 * break this suite.
 */

import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const CMS_ROOT = resolve(import.meta.dir, '..');
const FIXTURES = join(CMS_ROOT, 'fixtures', 'collections');
const GENERATED_PROJECTS_MODULE = resolve(
	CMS_ROOT,
	'../web/src/lib/content/projects.ts',
);

const CURRENT_STATIONS = [
	'database-engineering',
	'data-pipeline',
	'analytics-reporting',
	'web-development',
] as const;

interface RowWithId {
	id: string;
}

function loadFixture(name: string): RowWithId[] {
	return JSON.parse(readFileSync(join(FIXTURES, name), 'utf-8')) as RowWithId[];
}

describe('fixtures mirror real content (no lorem)', () => {
	for (const name of ['projects.json', 'services.json', 'blog-posts.json']) {
		it(`${name} contains no lorem- rows`, () => {
			const lorem = loadFixture(name)
				.map((r) => r.id)
				.filter((id) => id.startsWith('lorem-'));
			expect(lorem).toEqual([]);
		});
	}
});

describe('services fixture matches the four-station catalog', () => {
	it('visible services are exactly the current stations', () => {
		const services = loadFixture('services.json') as Array<RowWithId & { visible: boolean }>;
		const visible = services
			.filter((s) => s.visible)
			.map((s) => s.id)
			.sort();
		expect(visible).toEqual([...CURRENT_STATIONS].sort());
	});
});

describe('projects fixture cross-checks the committed generated module', () => {
	it('every published fixture project id appears in content/projects.ts', () => {
		const projects = loadFixture('projects.json') as Array<RowWithId & { status: string }>;
		expect(projects.length).toBeGreaterThan(0);
		const generated = readFileSync(GENERATED_PROJECTS_MODULE, 'utf-8');
		const missing = projects
			.filter((p) => p.status === 'published')
			.map((p) => p.id)
			.filter((id) => !generated.includes(`'${id}'`) && !generated.includes(`"${id}"`));
		expect(missing).toEqual([]);
	});
});
