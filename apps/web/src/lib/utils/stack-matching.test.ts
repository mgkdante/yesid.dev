// stack-matching tests (slice-29) — written FIRST per TDD.
// matchArchetypes is THE one pure function behind compose-as-matching: picked
// tech ids in, ranked archetype matches out. No DOM, no state, no fetches.

import { describe, it, expect } from 'vitest';
import type { StackArchetype } from '@repo/shared/schemas';
import { matchArchetypes, type Match } from './stack-matching';

const ls = (en: string) => ({ en });

const archetype = (
	slug: string,
	techIds: ReadonlyArray<readonly [string, 'interface' | 'logic' | 'data' | 'infra']>,
): StackArchetype => ({
	slug,
	title: ls(`title ${slug}`),
	hook: ls(`hook ${slug}`),
	description: ls(`description ${slug}`),
	proofProjectSlug: 'transit-data-pipeline',
	serviceId: 'sql-development',
	tech: techIds.map(([id, layer], i) => ({ id, layer, sort: i + 1 })),
});

// Mirrors the committed launch shapes (4-tech dashboard, 3-tech pipeline/site).
const DASHBOARD = archetype('data-dashboard', [
	['sveltekit', 'interface'],
	['rest-api', 'logic'],
	['postgresql', 'data'],
	['docker', 'infra'],
]);
const PIPELINE = archetype('data-pipeline', [
	['python', 'logic'],
	['postgresql', 'data'],
	['docker', 'infra'],
]);
const WEBSITE = archetype('fast-website', [
	['sveltekit', 'interface'],
	['typescript', 'logic'],
	['vercel', 'infra'],
]);

const ALL = [DASHBOARD, PIPELINE, WEBSITE];

describe('matchArchetypes', () => {
	it('returns [] for empty picks', () => {
		expect(matchArchetypes([], ALL)).toEqual([]);
	});

	it('returns [] when no archetype covers any pick (zero-match)', () => {
		expect(matchArchetypes(['cobol'], ALL)).toEqual([]);
		expect(matchArchetypes(['cobol', 'fortran'], ALL)).toEqual([]);
	});

	it('computes coverage as |picked ∩ stackIds| / |stackIds|', () => {
		const matches = matchArchetypes(['postgresql', 'docker'], [PIPELINE]);
		expect(matches).toHaveLength(1);
		expect(matches[0].slug).toBe('data-pipeline');
		expect(matches[0].coverage).toBeCloseTo(2 / 3);
	});

	it('excludes zero-coverage archetypes while keeping the rest', () => {
		const matches = matchArchetypes(['vercel'], ALL);
		expect(matches.map((m) => m.slug)).toEqual(['fast-website']);
	});

	it('sorts by coverage desc, then slug asc on ties', () => {
		// postgresql+docker: pipeline 2/3, dashboard 2/4 — coverage decides.
		const ranked = matchArchetypes(['postgresql', 'docker'], ALL);
		expect(ranked.map((m) => m.slug)).toEqual(['data-pipeline', 'data-dashboard']);

		// sveltekit alone: dashboard 1/4 vs website 1/3 — website wins on coverage.
		const single = matchArchetypes(['sveltekit'], ALL);
		expect(single.map((m) => m.slug)).toEqual(['fast-website', 'data-dashboard']);

		// Tie case: two archetypes with identical coverage → slug asc.
		const tieA = archetype('zz-last', [['postgresql', 'data'], ['docker', 'infra']]);
		const tieB = archetype('aa-first', [['postgresql', 'data'], ['python', 'logic']]);
		const tied = matchArchetypes(['postgresql'], [tieA, tieB]);
		expect(tied.map((m) => m.slug)).toEqual(['aa-first', 'zz-last']);
		expect(tied[0].coverage).toBe(tied[1].coverage);
	});

	it('picks outside every archetype do not distort coverage', () => {
		const withNoise = matchArchetypes(['postgresql', 'docker', 'cobol'], [PIPELINE]);
		const without = matchArchetypes(['postgresql', 'docker'], [PIPELINE]);
		expect(withNoise[0].coverage).toBe(without[0].coverage);
		expect(withNoise[0].matched).toEqual(without[0].matched);
		expect(withNoise[0].missing).toEqual(without[0].missing);
	});

	it('matched + missing preserve archetype tech order and partition the stack', () => {
		// Pick in reverse order — output must follow DASHBOARD's tech order.
		const [m] = matchArchetypes(['docker', 'sveltekit'], [DASHBOARD]);
		expect(m.matched).toEqual(['sveltekit', 'docker']);
		expect(m.missing).toEqual(['rest-api', 'postgresql']);
		expect([...m.matched, ...m.missing].sort()).toEqual(
			DASHBOARD.tech.map((t) => t.id).sort(),
		);
	});

	it('full coverage reports 1 with no missing', () => {
		const [m] = matchArchetypes(['sveltekit', 'typescript', 'vercel'], [WEBSITE]);
		expect(m.coverage).toBe(1);
		expect(m.matched).toEqual(['sveltekit', 'typescript', 'vercel']);
		expect(m.missing).toEqual([]);
	});

	it('duplicate picks count once', () => {
		const [m] = matchArchetypes(['postgresql', 'postgresql'], [PIPELINE]);
		expect(m.coverage).toBeCloseTo(1 / 3);
		expect(m.matched).toEqual(['postgresql']);
	});

	it('does not mutate its inputs', () => {
		const picked = ['docker', 'postgresql'];
		const before = JSON.stringify(ALL);
		matchArchetypes(picked, ALL);
		expect(picked).toEqual(['docker', 'postgresql']);
		expect(JSON.stringify(ALL)).toBe(before);
	});

	it('Match shape carries slug/coverage/matched/missing exactly', () => {
		const [m] = matchArchetypes(['python'], [PIPELINE]);
		const expected: Match = {
			slug: 'data-pipeline',
			coverage: 1 / 3,
			matched: ['python'],
			missing: ['postgresql', 'docker'],
		};
		expect(m).toEqual(expected);
	});
});
