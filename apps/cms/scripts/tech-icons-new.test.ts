import { describe, expect, it } from 'bun:test';
import { TECH_ICON_TARGETS } from './tech-icons-new';

describe('tech-icons-new target map', () => {
	it('covers the normalized tech rows that should no longer use fallback marks', () => {
		expect(TECH_ICON_TARGETS.map((target) => target.id).sort()).toEqual([
			'dbt',
			'directus',
			'figma',
			'liquid',
			'neon',
			'pl-pgsql',
			'retool',
			'shopify',
			'sql',
			'turbo',
		]);
	});

	it('uses valid Iconify id syntax for every target', () => {
		for (const target of TECH_ICON_TARGETS) {
			expect(target.iconify_id).toMatch(/^[a-z][a-z0-9-]*:[a-z0-9-]+$/);
		}
	});
});
