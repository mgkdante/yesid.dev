// EngineState tests (slice-29 Task 8) — written FIRST per TDD.
// The engine's whole interaction surface lives in this runes class; the
// Svelte components are thin views over it.

import { describe, it, expect } from 'vitest';
import type { StackArchetype } from '@repo/shared/schemas';
import { EngineState } from './engine-state.svelte';

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

	it('exposes the active archetype object via active', () => {
		const s = new EngineState(FIXTURES);
		expect(s.active).toBeNull();
		s.selectArchetype('data-pipeline');
		expect(s.active?.slug).toBe('data-pipeline');
		s.selectArchetype('not-a-slug');
		expect(s.active).toBeNull();
	});
});
