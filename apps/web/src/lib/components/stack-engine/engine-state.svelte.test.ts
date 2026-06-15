// EngineState tests (slice-29 Task 8) — written FIRST per TDD.
// The engine's whole interaction surface lives in this runes class; the
// Svelte components are thin views over it.

import { describe, it, expect } from 'vitest';
import type { StackArchetype } from '@repo/shared/schemas';
import {
	EngineState,
	seedFromParams,
	coerceEngineSeed,
	type EngineSeed,
} from './engine-state.svelte';

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

const FIXTURES: StackArchetype[] = [
	archetype('data-dashboard', [
		['sveltekit', 'interface'],
		['rest-api', 'logic'],
		['postgresql', 'data'],
		['docker', 'infra'],
	]),
	archetype('data-pipeline', [
		['python', 'logic'],
		['postgresql', 'data'],
		['docker', 'infra'],
	]),
];

describe('EngineState', () => {
	it('boots in goal mode, select view, nothing active, nothing picked', () => {
		const s = new EngineState(FIXTURES);
		expect(s.mode).toBe('goal');
		expect(s.view).toBe('select');
		expect(s.activeArchetype).toBeNull();
		expect(s.pickedTechs.size).toBe(0);
		expect(s.matches).toEqual([]);
	});

	it('defaults to the committed stackArchetypes module', () => {
		const s = new EngineState();
		expect(s.archetypes.length).toBeGreaterThanOrEqual(3);
		expect(s.archetypes.map((a) => a.slug)).toContain('data-dashboard');
	});

	it('selectArchetype activates the slug and moves to the blueprint view', () => {
		const s = new EngineState(FIXTURES);
		s.selectArchetype('data-dashboard');
		expect(s.activeArchetype).toBe('data-dashboard');
		expect(s.view).toBe('blueprint');
	});

	it('toggleTech picks and unpicks', () => {
		const s = new EngineState(FIXTURES);
		s.toggleTech('docker');
		expect(s.pickedTechs.has('docker')).toBe(true);
		s.toggleTech('docker');
		expect(s.pickedTechs.has('docker')).toBe(false);
	});

	it('matches recompute as techs toggle (derived over pickedTechs)', () => {
		const s = new EngineState(FIXTURES);
		expect(s.matches).toEqual([]);
		s.toggleTech('postgresql');
		expect(s.matches.map((m) => m.slug)).toEqual(['data-pipeline', 'data-dashboard']);
		s.toggleTech('sveltekit');
		const dashboard = s.matches.find((m) => m.slug === 'data-dashboard');
		expect(dashboard?.matched).toEqual(['sveltekit', 'postgresql']);
		s.toggleTech('postgresql');
		s.toggleTech('sveltekit');
		expect(s.matches).toEqual([]);
	});

	it('switching mode resets view→select and activeArchetype→null but PRESERVES picks', () => {
		const s = new EngineState(FIXTURES);
		s.toggleTech('docker');
		s.toggleTech('python');
		s.selectArchetype('data-dashboard');
		expect(s.view).toBe('blueprint');

		s.setMode('compose');
		expect(s.mode).toBe('compose');
		expect(s.view).toBe('select');
		expect(s.activeArchetype).toBeNull();
		expect([...s.pickedTechs].sort()).toEqual(['docker', 'python']);

		// And back — picks still intact.
		s.selectArchetype('data-pipeline');
		s.setMode('goal');
		expect(s.view).toBe('select');
		expect(s.activeArchetype).toBeNull();
		expect([...s.pickedTechs].sort()).toEqual(['docker', 'python']);
	});

	it('setting the same mode is a no-op (no view reset)', () => {
		const s = new EngineState(FIXTURES);
		s.selectArchetype('data-dashboard');
		s.setMode('goal');
		expect(s.view).toBe('blueprint');
		expect(s.activeArchetype).toBe('data-dashboard');
	});

	it('toggleBlueprintPreview flips blueprint⇄preview and is inert in select view', () => {
		const s = new EngineState(FIXTURES);
		s.toggleBlueprintPreview();
		expect(s.view).toBe('select');
		s.selectArchetype('data-dashboard');
		s.toggleBlueprintPreview();
		expect(s.view).toBe('preview');
		s.toggleBlueprintPreview();
		expect(s.view).toBe('blueprint');
	});

	it('backToSelect leaves blueprint/preview and clears the active archetype', () => {
		const s = new EngineState(FIXTURES);
		s.toggleTech('docker');
		s.selectArchetype('data-dashboard');
		s.backToSelect();
		expect(s.view).toBe('select');
		expect(s.activeArchetype).toBeNull();
		// Picks survive backing out too.
		expect(s.pickedTechs.has('docker')).toBe(true);
	});

	it('exposes the active archetype object via active', () => {
		const s = new EngineState(FIXTURES);
		expect(s.active).toBeNull();
		s.selectArchetype('data-pipeline');
		expect(s.active?.slug).toBe('data-pipeline');
		s.selectArchetype('not-a-slug');
		expect(s.active).toBeNull();
	});

	// ── Round 4 nav: stepped back, undo, start over, history hook. ──────────
	it('round 4: back() steps preview → blueprint → select (and is inert in select)', () => {
		const s = new EngineState(FIXTURES);
		s.back();
		expect(s.view).toBe('select');

		s.selectArchetype('data-dashboard');
		s.toggleBlueprintPreview();
		expect(s.view).toBe('preview');

		s.back();
		expect(s.view).toBe('blueprint');
		expect(s.activeArchetype).toBe('data-dashboard'); // still on the drawing

		s.back();
		expect(s.view).toBe('select');
		expect(s.activeArchetype).toBeNull();
	});

	it('round 4: undoLastPick removes the MOST RECENT pick (insertion order, re-toggles re-rank)', () => {
		const s = new EngineState(FIXTURES);
		s.toggleTech('postgresql');
		s.toggleTech('docker');
		s.toggleTech('python');
		s.undoLastPick();
		expect([...s.pickedTechs]).toEqual(['postgresql', 'docker']);

		// Re-toggling moves a pick to the end — undo forgets THAT one.
		s.toggleTech('postgresql');
		s.toggleTech('postgresql');
		expect([...s.pickedTechs]).toEqual(['docker', 'postgresql']);
		s.undoLastPick();
		expect([...s.pickedTechs]).toEqual(['docker']);

		// Empty set: a no-op, never a throw.
		s.undoLastPick();
		s.undoLastPick();
		expect(s.pickedTechs.size).toBe(0);
	});

	it('round 4: clearPicks starts over (matches re-derive to empty)', () => {
		const s = new EngineState(FIXTURES);
		s.toggleTech('postgresql');
		s.toggleTech('docker');
		expect(s.matches.length).toBeGreaterThan(0);
		s.clearPicks();
		expect(s.pickedTechs.size).toBe(0);
		expect(s.matches).toEqual([]);
	});

	it('round 4: selectArchetype notifies the onDetailOpen hook (Engine wires shallow history there)', () => {
		const s = new EngineState(FIXTURES);
		const opened: string[] = [];
		s.onDetailOpen = (slug) => opened.push(slug);
		s.selectArchetype('data-pipeline');
		expect(opened).toEqual(['data-pipeline']);
		// No hook → no throw (unit-test/router-less default).
		s.onDetailOpen = null;
		s.selectArchetype('data-dashboard');
		expect(opened).toEqual(['data-pipeline']);
	});

	// ── slice-34.2: boot seed (switch-restore / inbound deep-link) + serialize ──
	it('seed: no seed boots at plain defaults (goal/select/empty)', () => {
		const s = new EngineState(FIXTURES, null);
		expect(s.mode).toBe('goal');
		expect(s.view).toBe('select');
		expect(s.activeArchetype).toBeNull();
		expect(s.pickedTechs.size).toBe(0);
	});

	it('seed: an archetype seeds the blueprint view and the active slug', () => {
		const seed: EngineSeed = { mode: 'goal', archetype: 'data-dashboard', techs: [] };
		const s = new EngineState(FIXTURES, seed);
		expect(s.mode).toBe('goal');
		expect(s.activeArchetype).toBe('data-dashboard');
		expect(s.view).toBe('blueprint'); // DERIVED from a present archetype, never carried
		expect(s.active?.slug).toBe('data-dashboard');
	});

	it('seed: compose mode + picks restore the build; view stays select with no archetype', () => {
		const seed: EngineSeed = { mode: 'compose', archetype: null, techs: ['postgresql', 'docker'] };
		const s = new EngineState(FIXTURES, seed);
		expect(s.mode).toBe('compose');
		expect(s.activeArchetype).toBeNull();
		expect(s.view).toBe('select');
		expect([...s.pickedTechs]).toEqual(['postgresql', 'docker']); // insertion order kept
		// Deriveds over the SAME SvelteSet instance still fire — matches recompute.
		expect(s.matches.map((m) => m.slug)).toContain('data-pipeline');
	});

	it('seed: an UNKNOWN archetype is stripped — falls back to select, no active', () => {
		const seed: EngineSeed = { mode: 'goal', archetype: 'not-a-real-archetype', techs: [] };
		const s = new EngineState(FIXTURES, seed);
		expect(s.activeArchetype).toBeNull();
		expect(s.view).toBe('select');
	});

	it('seed: seeding does NOT fire onDetailOpen (no shallow-history push on restore)', () => {
		const opened: string[] = [];
		const seed: EngineSeed = { mode: 'goal', archetype: 'data-dashboard', techs: [] };
		const s = new EngineState(FIXTURES, seed);
		s.onDetailOpen = (slug) => opened.push(slug);
		// The constructor already applied the seed; the hook (wired AFTER) saw nothing.
		expect(opened).toEqual([]);
		expect(s.activeArchetype).toBe('data-dashboard');
	});

	it('serialize: snapshots the live build (mode + archetype + picks), omitting view/teach', () => {
		const s = new EngineState(FIXTURES);
		s.setMode('compose');
		s.toggleTech('postgresql');
		s.toggleTech('docker');
		s.selectArchetype('data-pipeline');
		expect(s.serialize()).toEqual({
			mode: 'compose',
			archetype: 'data-pipeline',
			techs: ['postgresql', 'docker'],
		});
	});

	it('serialize → seed round-trips a goal-mode blueprint', () => {
		const a = new EngineState(FIXTURES);
		a.selectArchetype('data-dashboard');
		const b = new EngineState(FIXTURES, a.serialize());
		expect(b.mode).toBe('goal');
		expect(b.activeArchetype).toBe('data-dashboard');
		expect(b.view).toBe('blueprint');
	});
});

describe('seedFromParams (inbound deep-link → EngineSeed)', () => {
	const params = (qs: string) => new URLSearchParams(qs);

	it('returns null when no engine params are present', () => {
		expect(seedFromParams(params(''), FIXTURES)).toBeNull();
		expect(seedFromParams(params('tag=svelte'), FIXTURES)).toBeNull();
	});

	it('parses mode + archetype + techs from the URL', () => {
		expect(
			seedFromParams(params('mode=compose&archetype=data-dashboard&techs=sveltekit.postgresql'), FIXTURES),
		).toEqual({ mode: 'compose', archetype: 'data-dashboard', techs: ['sveltekit', 'postgresql'] });
	});

	it('whitelists mode — an unknown mode falls back to goal', () => {
		expect(seedFromParams(params('mode=hack'), FIXTURES)?.mode).toBe('goal');
	});

	it('strips an unknown archetype (kept null) but keeps valid techs', () => {
		expect(seedFromParams(params('archetype=ghost&techs=docker'), FIXTURES)).toEqual({
			mode: 'goal',
			archetype: null,
			techs: ['docker'],
		});
	});

	it('drops garbage tech ids and dedupes (insertion order preserved)', () => {
		expect(
			seedFromParams(params('techs=docker.BAD%20ID.docker.python'), FIXTURES)?.techs,
		).toEqual(['docker', 'python']);
	});

	it('an empty techs param yields no picks (not [""])', () => {
		expect(seedFromParams(params('mode=compose&techs='), FIXTURES)?.techs).toEqual([]);
	});
});

describe('coerceEngineSeed (orchestrator restore blob → EngineSeed)', () => {
	it('returns null for non-object input', () => {
		expect(coerceEngineSeed(null, FIXTURES)).toBeNull();
		expect(coerceEngineSeed('nope', FIXTURES)).toBeNull();
		expect(coerceEngineSeed(undefined, FIXTURES)).toBeNull();
	});

	it('coerces a well-formed blob, whitelisting mode/archetype and the id grammar', () => {
		expect(
			coerceEngineSeed(
				{ mode: 'compose', archetype: 'data-pipeline', techs: ['docker', 'python', 'docker'] },
				FIXTURES,
			),
		).toEqual({ mode: 'compose', archetype: 'data-pipeline', techs: ['docker', 'python'] });
	});

	it('defends against a tampered blob (bad mode/archetype/tech types)', () => {
		expect(
			coerceEngineSeed(
				{ mode: 42, archetype: 'ghost', techs: ['ok-id', 7, 'Bad Id', null] },
				FIXTURES,
			),
		).toEqual({ mode: 'goal', archetype: null, techs: ['ok-id'] });
	});
});
