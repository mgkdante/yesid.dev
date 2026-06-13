import { describe, expect, it } from 'bun:test';
import {
	FLAT_FIELD_PLAN,
	translationFieldsFor,
	parentFieldsFor,
	digPath,
} from '../scripts/lib/flat-field-plan';

const count = (c: string) => translationFieldsFor(c).length;

describe('FLAT_FIELD_PLAN shape', () => {
	it('covers the 7 translation collections with the locked column counts', () => {
		expect(count('block_hero_translations')).toBe(12);
		expect(count('block_manifesto_translations')).toBe(25);
		expect(count('block_closer_translations')).toBe(18);
		// 13 flattened from JSON + 5 seeded hero terminal templates (operator
		// addendum) + 1 seeded stack_explainer (go2/w5 engine-layered-learning)
		expect(count('block_tech_stack_page_content_translations')).toBe(19);
		expect(count('block_contact_content_translations')).toBe(21);
		expect(count('block_about_content_translations')).toBe(27); // 26 string + polaroids list
		expect(count('block_about_intro_translations')).toBe(2);
	});
	it('parent scalar moves are locked at 13', () => {
		expect(parentFieldsFor('block_contact_content').length).toBe(7);
		expect(parentFieldsFor('block_about_content').length).toBe(6);
		expect(FLAT_FIELD_PLAN.filter((f) => f.scope === 'parent').length).toBe(13);
	});
	it('no new field collides with an existing column name', () => {
		// existing non-JSON columns on the touched collections (from snapshot/fields/**)
		const existing: Record<string, string[]> = {
			block_hero_translations: ['cta_contact', 'cta_work', 'subheadline', 'subtitle'],
			block_manifesto_translations: ['pills', 'hidden_transit_lines'],
			block_closer_translations: ['heading', 'heading_dot', 'subheading'],
			block_contact_content_translations: ['page_title', 'send_error_message', 'socials', 'station_label'],
			block_about_content_translations: ['interests', 'methodology', 'metrics', 'testimonials'],
			block_about_intro_translations: ['bio', 'interests', 'interests_label', 'location_label', 'more_link', 'name', 'stack_label', 'title'],
			block_tech_stack_page_content_translations: [],
			block_contact_content: ['web3forms_key', 'editor_label', 'status', 'sort'],
			block_about_content: ['client_count', 'client_logos', 'tech_stack', 'editor_label', 'status', 'sort'],
			block_closer: ['attribution_url', 'cta_href', 'editor_label', 'status', 'sort'],
		};
		for (const f of FLAT_FIELD_PLAN) {
			expect(existing[f.collection] ?? []).not.toContain(f.field);
		}
	});
	it('the 6 seeded tech-stack columns carry their EN seeds (operator addendum + go2/w5)', () => {
		// Net-new columns extracted from hardcoded /tech-stack component strings —
		// no JSON source exists, so each carries an EN seed. {count} stays a
		// literal token: the component interpolates it from data.items.length
		// (computed, never stored). stack_explainer's seed is byte-identical to
		// the component fallback (FALLBACK_STACK_EXPLAINER in the route).
		const seeds = Object.fromEntries(
			translationFieldsFor('block_tech_stack_page_content_translations')
				.filter((f) => f.seed !== undefined)
				.map((f) => [f.field, f.seed]),
		);
		expect(seeds).toEqual({
			terminal_cmd: '~ yesid --stack --verbose',
			terminal_loading: '→ loading {count} nodes...',
			terminal_success: '✓ successful',
			terminal_cataloged: '→ {count} technologies cataloged',
			terminal_status: 'interactive map online.',
			stack_explainer:
				'A "stack" is just the parts list of a piece of software: the interface people touch, the logic that decides things, the data it remembers, and the infrastructure it runs on. That\'s the whole secret. Once you can read a stack, a quote can\'t hide much from you — poke the blueprints below and see for yourself.',
		});
		// No other collection carries seeds.
		expect(
			FLAT_FIELD_PLAN.filter(
				(f) =>
					f.scope === 'translation' &&
					f.seed !== undefined &&
					f.collection !== 'block_tech_stack_page_content_translations',
			),
		).toEqual([]);
	});
	it('digPath walks nested objects and returns undefined off-path', () => {
		expect(digPath({ a: { b: 'x' } }, ['a', 'b'])).toBe('x');
		expect(digPath({ a: 1 }, ['a', 'b'])).toBeUndefined();
		expect(digPath(['whole'], [])).toEqual(['whole']);
	});
});
