// blueprint-param tests (slice-29) — written FIRST per TDD.
// ?bp= carries a blueprint from the Tech Stack Engine to /contact:
//   '<archetype-slug|custom>~techId.techId.techId'
// decode NEVER throws — garbage in, null out.

import { describe, it, expect } from 'vitest';
import {
	encodeBlueprint,
	decodeBlueprint,
	blueprintPrefillMessage,
} from './blueprint-param';

describe('encodeBlueprint', () => {
	it('encodes an archetype blueprint as slug~id.id.id', () => {
		expect(
			encodeBlueprint({
				archetype: 'data-dashboard',
				techs: ['sveltekit', 'rest-api', 'postgresql', 'docker'],
			}),
		).toBe('data-dashboard~sveltekit.rest-api.postgresql.docker');
	});

	it('encodes a custom (null archetype) blueprint under the custom head', () => {
		expect(encodeBlueprint({ archetype: null, techs: ['python', 'docker'] })).toBe(
			'custom~python.docker',
		);
	});

	it('encodes empty techs with an empty tail', () => {
		expect(encodeBlueprint({ archetype: 'fast-website', techs: [] })).toBe('fast-website~');
	});

	it('output is URL-safe as-is (slugs are [a-z0-9-]; ~ and . are unreserved)', () => {
		const out = encodeBlueprint({ archetype: 'data-dashboard', techs: ['svelte-5', 't-sql'] });
		// encodeURIComponent leaves the whole value untouched — no percent-encoding needed.
		expect(encodeURIComponent(out)).toBe(out);
		expect(out).toMatch(/^[a-z0-9-]+~[a-z0-9.-]*$/);
	});
});

describe('decodeBlueprint', () => {
	it('decodes an archetype blueprint (inverse of encode)', () => {
		const bp = { archetype: 'data-dashboard', techs: ['sveltekit', 'postgresql'] };
		expect(decodeBlueprint(encodeBlueprint(bp))).toEqual(bp);
	});

	it('decodes the custom head to archetype null (inverse of encode)', () => {
		const bp = { archetype: null, techs: ['python', 'docker'] };
		expect(decodeBlueprint(encodeBlueprint(bp))).toEqual(bp);
	});

	it('decodes an empty tail to empty techs', () => {
		expect(decodeBlueprint('fast-website~')).toEqual({ archetype: 'fast-website', techs: [] });
	});

	it('returns null on garbage, never throwing', () => {
		const garbage = [
			null,
			undefined,
			'',
			'~',
			'no-tilde',
			'~sveltekit.docker',
			'UPPER~sveltekit',
			'data dashboard~x',
			'dash~sveltekit..docker',
			'dash~svelte_kit',
			'dash~SVELTE',
			'a~b~c',
			'dash~.',
			'custom~tech.',
			'%%%~///',
		];
		for (const raw of garbage) {
			expect(() => decodeBlueprint(raw as string | null)).not.toThrow();
			expect(decodeBlueprint(raw as string | null), `expected null for ${String(raw)}`).toBeNull();
		}
	});
});

describe('blueprintPrefillMessage', () => {
	it('builds the message from a real archetype title + tech display names', () => {
		expect(
			blueprintPrefillMessage('data-dashboard~sveltekit.rest-api.postgresql.docker'),
		).toBe(
			"I'm interested in something like A data dashboard built on SvelteKit, REST API, PostgreSQL, Docker.",
		);
	});

	it("falls back to 'a custom stack' for the custom head", () => {
		expect(blueprintPrefillMessage('custom~python.docker')).toBe(
			"I'm interested in something like a custom stack built on Python, Docker.",
		);
	});

	it("falls back to 'a custom stack' for an unknown archetype slug", () => {
		expect(blueprintPrefillMessage('not-a-real-archetype~docker')).toBe(
			"I'm interested in something like a custom stack built on Docker.",
		);
	});

	it('skips unknown tech ids', () => {
		expect(blueprintPrefillMessage('custom~docker.not-a-tech.python')).toBe(
			"I'm interested in something like a custom stack built on Docker, Python.",
		);
	});

	it('drops the built-on clause when no tech id resolves', () => {
		expect(blueprintPrefillMessage('data-dashboard~')).toBe(
			"I'm interested in something like A data dashboard.",
		);
		expect(blueprintPrefillMessage('custom~not-a-tech')).toBe(
			"I'm interested in something like a custom stack.",
		);
	});

	it('returns null when the param is missing or garbage', () => {
		expect(blueprintPrefillMessage(null)).toBeNull();
		expect(blueprintPrefillMessage('')).toBeNull();
		expect(blueprintPrefillMessage('garbage!!!')).toBeNull();
	});
});
