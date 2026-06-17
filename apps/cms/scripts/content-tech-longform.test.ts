import { describe, expect, it } from 'bun:test';
import { TECH_LONGFORM_TARGETS } from './content-tech-longform';

const fields = ['enables', 'what_it_is', 'what_i_use_it_for', 'why_i_use_it_instead'] as const;

describe('content-tech-longform copy', () => {
	it('covers the normalized tech rows with EN and FR copy', () => {
		expect(TECH_LONGFORM_TARGETS.map((target) => target.id).sort()).toEqual([
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

	it('has non-empty longform fields and no em dashes', () => {
		for (const target of TECH_LONGFORM_TARGETS) {
			for (const locale of ['en', 'fr'] as const) {
				for (const field of fields) {
					const value = target[locale][field];
					expect(value.trim().length, `${target.id}/${locale}/${field}`).toBeGreaterThan(40);
					expect(value, `${target.id}/${locale}/${field}`).not.toContain('\u2014');
				}
			}
		}
	});
});
