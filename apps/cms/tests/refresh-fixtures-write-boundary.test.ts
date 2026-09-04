import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateAndWriteRefreshFixtures } from '../scripts/refresh-fixtures';

const FIXTURES_ROOT = join(import.meta.dir, '../fixtures');

function loadJson(path: string): unknown {
	return JSON.parse(readFileSync(join(FIXTURES_ROOT, path), 'utf8'));
}

function validRefreshData() {
	return {
		projects: loadJson('collections/projects.json'),
		services: loadJson('collections/services.json'),
		posts: loadJson('collections/blog-posts.json'),
		routeSeo: loadJson('collections/route-seo.json'),
		siteMeta: loadJson('singletons/site-meta.json'),
	};
}

describe('refresh-fixtures validation and local write boundary', () => {
	it('validates a dry-run but performs no local writes', () => {
		const writes: string[] = [];
		validateAndWriteRefreshFixtures(validRefreshData(), true, (path) => {
			writes.push(path);
		});
		expect(writes).toEqual([]);
	});

	it('rejects invalid fetched data during dry-run before any local write', () => {
		const writes: string[] = [];
		const invalid = { ...validRefreshData(), projects: [] };
		expect(() =>
			validateAndWriteRefreshFixtures(invalid, true, (path) => {
				writes.push(path);
			}),
		).toThrow();
		expect(writes).toEqual([]);
	});

	it('enables exactly the five existing fixture writes in apply mode', () => {
		const writes: string[] = [];
		validateAndWriteRefreshFixtures(validRefreshData(), false, (path) => {
			writes.push(path.slice(path.lastIndexOf('/') + 1));
		});
		expect(writes).toEqual([
			'projects.json',
			'services.json',
			'blog-posts.json',
			'route-seo.json',
			'site-meta.json',
		]);
	});
});
