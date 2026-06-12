// stack-matching tests (slice-29, AND-rewrite go2/w4) — written FIRST per TDD.
// matchArchetypes is THE one pure function behind compose-as-matching: picked
// tech ids in, ranked archetype matches out. No DOM, no state, no fetches.
//
// go2/w4 operator QA: matching is AND, not OR — an archetype qualifies ONLY
// when EVERY picked tech is in its stack (picked ⊆ stack). More picks narrow
// the result set; they never widen it.

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

describe('matchArchetypes (AND semantics)', () => {
	it('returns [] for empty picks', () => {
		expect(matchArchetypes([], ALL)).toEqual([]);
	});

	it('returns [] when no archetype contains every pick (zero-match)', () => {
		expect(matchArchetypes(['cobol'], ALL)).toEqual([]);
		expect(matchArchetypes(['cobol', 'fortran'], ALL)).toEqual([]);
	});

	it('an archetype matches ONLY if every picked tech is in its stack', () => {
		// python is in PIPELINE but sveltekit is not → PIPELINE disqualified.
		expect(matchArchetypes(['python', 'sveltekit'], [PIPELINE])).toEqual([]);
		// Both picks in PIPELINE → it matches.
		expect(matchArchetypes(['python', 'docker'], [PIPELINE])).toHaveLength(1);
	});

	it('more picks never widen the result set (monotone narrowing)', () => {
		const one = matchArchetypes(['sveltekit'], ALL).map((m) => m.slug);
		const two = matchArchetypes(['sveltekit', 'typescript'], ALL).map((m) => m.slug);
		const three = matchArchetypes(['sveltekit', 'typescript', 'postgresql'], ALL).map(
			(m) => m.slug,
		);
		// sveltekit → dashboard + website; +typescript → website only; +postgresql → none.
		expect(one.sort()).toEqual(['data-dashboard', 'fast-website']);
		expect(two).toEqual(['fast-website']);
		expect(three).toEqual([]);
		// Subset relation holds at every step.
		expect(two.every((slug) => one.includes(slug))).toBe(true);
	});

	it('computes coverage as picked share of the matched stack', () => {
		const matches = matchArchetypes(['postgresql', 'docker'], [PIPELINE]);
		expect(matches).toHaveLength(1);
		expect(matches[0].slug).toBe('data-pipeline');
		expect(matches[0].coverage).toBeCloseTo(2 / 3);
	});

	it('excludes archetypes missing any pick while keeping full-subset ones', () => {
		const matches = matchArchetypes(['vercel'], ALL);
		expect(matches.map((m) => m.slug)).toEqual(['fast-website']);
	});

	it('ranks by fewer missing first (closest to complete), then slug asc', () => {
		// postgresql+docker: pipeline missing 1 (python), dashboard missing 2 — fewer missing wins.
		const ranked = matchArchetypes(['postgresql', 'docker'], ALL);
		expect(ranked.map((m) => m.slug)).toEqual(['data-pipeline', 'data-dashboard']);

		// sveltekit alone: website missing 2 vs dashboard missing 3 — website first.
		const single = matchArchetypes(['sveltekit'], ALL);
		expect(single.map((m) => m.slug)).toEqual(['fast-website', 'data-dashboard']);

		// Tie case: identical missing counts → slug asc.
		const tieA = archetype('zz-last', [['postgresql', 'data'], ['docker', 'infra']]);
		const tieB = archetype('aa-first', [['postgresql', 'data'], ['python', 'logic']]);
		const tied = matchArchetypes(['postgresql'], [tieA, tieB]);
		expect(tied.map((m) => m.slug)).toEqual(['aa-first', 'zz-last']);
		expect(tied[0].missing.length).toBe(tied[1].missing.length);
	});

	it('a pick outside an archetype stack disqualifies that archetype', () => {
		// Old OR contract tolerated noise picks; AND rejects the whole combo.
		expect(matchArchetypes(['postgresql', 'docker', 'cobol'], [PIPELINE])).toEqual([]);
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
