import { describe, it, expect } from 'bun:test';
import { STACK_LAYERS } from '@repo/shared/schemas';
import { buildSeedPlan, parseFlags } from '../scripts/seed-stack-archetypes';
// Committed content modules — the seed may only reference ids that really exist
// (type-only imports inside these modules, so bun can load them directly).
import { techStackItems } from '../../web/src/lib/content/tech-stack';
import { projects } from '../../web/src/lib/content/projects';
import { services } from '../../web/src/lib/content/services';

const plan = buildSeedPlan();
const techIds = new Set(techStackItems.map((t) => t.id));
const projectSlugs = new Set(projects.map((p) => p.slug));
const serviceIds = new Set(services.map((s) => s.id));

describe('seed-stack-archetypes buildSeedPlan', () => {
	it('seeds exactly the 3 launch archetypes', () => {
		expect(plan.archetypes.map((a) => a.slug)).toEqual([
			'data-dashboard',
			'data-pipeline',
			'fast-website',
		]);
	});

	it('every archetype is published and idempotent by slug (unique slugs)', () => {
		for (const a of plan.archetypes) expect(a.status).toBe('published');
		expect(new Set(plan.archetypes.map((a) => a.slug)).size).toBe(plan.archetypes.length);
	});

	it('every referenced tech id exists in the committed tech module', () => {
		for (const a of plan.archetypes) {
			for (const link of a.tech) {
				expect(techIds.has(link.id)).toBe(true);
			}
		}
		for (const t of plan.techDefaults) {
			expect(techIds.has(t.id)).toBe(true);
		}
	});

	it('every archetype composes at least 3 distinct layers', () => {
		for (const a of plan.archetypes) {
			const layers = new Set(a.tech.map((l) => l.layer));
			expect(layers.size).toBeGreaterThanOrEqual(3);
			for (const layer of layers) expect(STACK_LAYERS).toContain(layer);
		}
	});

	it('tech links carry 1..n sort values within each archetype', () => {
		for (const a of plan.archetypes) {
			expect([...a.tech.map((l) => l.sort)].sort((x, y) => x - y)).toEqual(
				a.tech.map((_, i) => i + 1),
			);
		}
	});

	it('proof projects + services point at real committed rows', () => {
		for (const a of plan.archetypes) {
			expect(projectSlugs.has(a.proofProjectSlug)).toBe(true);
			expect(serviceIds.has(a.serviceId)).toBe(true);
		}
		const bySlug = Object.fromEntries(plan.archetypes.map((a) => [a.slug, a]));
		expect(bySlug['data-dashboard']?.proofProjectSlug).toBe('transit-data-pipeline');
		expect(bySlug['data-dashboard']?.serviceId).toBe('sql-development');
		expect(bySlug['data-pipeline']?.proofProjectSlug).toBe('transit-data-pipeline');
		expect(bySlug['fast-website']?.proofProjectSlug).toBe('yesid-dev');
	});

	it('translations are complete for en at minimum (title, hook, description)', () => {
		for (const a of plan.archetypes) {
			const en = a.translations.find((t) => t.languages_code === 'en');
			expect(en?.title.trim().length).toBeGreaterThan(0);
			expect(en?.hook.trim().length).toBeGreaterThan(0);
			expect(en?.description.trim().length).toBeGreaterThan(0);
		}
	});

	it('pins the launch copy (titles + hooks per the slice spec)', () => {
		const bySlug = Object.fromEntries(plan.archetypes.map((a) => [a.slug, a]));
		const en = (slug: string) =>
			bySlug[slug]?.translations.find((t) => t.languages_code === 'en');
		expect(en('data-dashboard')?.title).toBe('A data dashboard');
		expect(en('data-dashboard')?.hook).toBe('See your numbers move.');
		expect(en('data-pipeline')?.title).toBe('A data pipeline');
		expect(en('data-pipeline')?.hook).toBe('From raw feeds to clean tables.');
		expect(en('fast-website')?.title).toBe('A fast website');
		expect(en('fast-website')?.hook).toBe('Static speed, living content.');
		const fr = bySlug['data-dashboard']?.translations.find((t) => t.languages_code === 'fr');
		const es = bySlug['data-dashboard']?.translations.find((t) => t.languages_code === 'es');
		expect(fr?.title).toBe('Un tableau de bord');
		expect(es?.title).toBe('Un panel de datos');
	});

	it('archetype icons match the spec', () => {
		const bySlug = Object.fromEntries(plan.archetypes.map((a) => [a.slug, a]));
		expect(bySlug['data-dashboard']?.icon).toBe('monitoring');
		expect(bySlug['data-pipeline']?.icon).toBe('conveyor_belt');
		expect(bySlug['fast-website']?.icon).toBe('rocket_launch');
	});

	it('ships layer defaults + trilingual enables for every tech referenced by an archetype', () => {
		const referenced = new Set(plan.archetypes.flatMap((a) => a.tech.map((l) => l.id)));
		const defaults = new Map(plan.techDefaults.map((t) => [t.id, t]));
		for (const id of referenced) {
			const d = defaults.get(id);
			expect(d).toBeDefined();
			expect(STACK_LAYERS).toContain(d!.layer);
			expect(d!.enables.en.trim().length).toBeGreaterThan(0);
			expect(d!.enables.fr.trim().length).toBeGreaterThan(0);
			expect(d!.enables.es.trim().length).toBeGreaterThan(0);
		}
	});

	it('is deterministic', () => {
		expect(buildSeedPlan()).toEqual(plan);
	});
});

describe('parseFlags', () => {
	it('defaults to dry-run; only --apply writes', () => {
		expect(parseFlags([]).apply).toBe(false);
		expect(parseFlags(['--dry-run']).apply).toBe(false);
		expect(parseFlags(['--apply']).apply).toBe(true);
	});
});
