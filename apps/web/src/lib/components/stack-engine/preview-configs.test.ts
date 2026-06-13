// preview-configs + ProductPreview tests (slice-29 Task 11; go2/w5 round 4).
//
// Round 4 contracts (operator asks 1 + 2):
//  - TOTALITY: every published archetype slug ships a crafted config —
//    "see it as a product" exists for every scenario.
//  - DUAL-ROLE: every slot carries a role line; when ONE tech occupies
//    MULTIPLE slots (Python as source AND transform), the roles are pairwise
//    distinct — the duplication explains itself.
//  - resolveArchetypePreview: occupant = layer tech at `pick` index (sorted
//    by sort); the FIRST slot per resolved TECH carries the flip id.
//  - buildComposedPreview: the composed build's generic preview — frame from
//    covered layers, one slot per pick, layer-banded inside the frame.

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { STACK_LAYERS, type StackLayer } from '@repo/shared/schemas';
import {
	PREVIEW_CONFIGS,
	FRAME_SIZES,
	COMPOSED_ROLES,
	resolveArchetypePreview,
	buildComposedPreview,
} from './preview-configs';
import ProductPreview from './ProductPreview.svelte';
import { stackArchetypes } from '$lib/content/stack-archetypes';

const bySlug = (slug: string) => stackArchetypes.find((a) => a.slug === slug)!;
const dashboard = bySlug('data-dashboard');
const website = bySlug('fast-website');
const pipeline = bySlug('data-pipeline');

describe('PREVIEW_CONFIGS — round 4 totality', () => {
	it('ships a crafted config for EVERY published archetype slug', () => {
		expect(Object.keys(PREVIEW_CONFIGS).sort()).toEqual(
			stackArchetypes.map((a) => a.slug).sort(),
		);
		for (const [key, config] of Object.entries(PREVIEW_CONFIGS)) {
			expect(config.slug).toBe(key);
		}
	});

	it('keeps the seed frames and gives shopping a phone', () => {
		expect(PREVIEW_CONFIGS['data-dashboard'].frame).toBe('browser');
		expect(PREVIEW_CONFIGS['data-pipeline'].frame).toBe('browser');
		expect(PREVIEW_CONFIGS['fast-website'].frame).toBe('phone');
		expect(PREVIEW_CONFIGS['online-store'].frame).toBe('phone');
	});

	it('every slot uses a canonical layer, stays inside its frame, and carries a role', () => {
		for (const config of Object.values(PREVIEW_CONFIGS)) {
			const frame = FRAME_SIZES[config.frame];
			expect(config.slots.length).toBeGreaterThan(0);
			for (const slot of config.slots) {
				expect(STACK_LAYERS).toContain(slot.layer);
				expect(slot.x).toBeGreaterThanOrEqual(0);
				expect(slot.y).toBeGreaterThanOrEqual(0);
				expect(slot.x + slot.w).toBeLessThanOrEqual(frame.w);
				expect(slot.y + slot.h).toBeLessThanOrEqual(frame.h);
				expect(slot.role.length, `${config.slug} slot role must not be empty`).toBeGreaterThan(0);
			}
		}
	});

	it('every slot names a layer its archetype actually covers, at a real pick index (nothing silently dropped)', () => {
		for (const archetype of stackArchetypes) {
			const config = PREVIEW_CONFIGS[archetype.slug];
			for (const slot of config.slots) {
				const layerTechs = archetype.tech.filter((l) => l.layer === slot.layer);
				expect(
					layerTechs.length,
					`${archetype.slug}: slot layer ${slot.layer} must be covered`,
				).toBeGreaterThan(0);
				expect(
					slot.pick ?? 0,
					`${archetype.slug}: pick index inside the ${slot.layer} layer`,
				).toBeLessThan(layerTechs.length);
			}
		}
	});

	it('dashboard crafts interface, logic, data, and infra slots', () => {
		const layers = new Set(PREVIEW_CONFIGS['data-dashboard'].slots.map((s) => s.layer));
		expect([...layers].sort()).toEqual(['data', 'infra', 'interface', 'logic'].sort());
	});
});

describe('round 4 dual-role audit — duplicated techs always tell distinct stories', () => {
	it('blueprint side: no archetype links the same tech twice (boxes never duplicate)', () => {
		for (const archetype of stackArchetypes) {
			const ids = archetype.tech.map((l) => l.id);
			expect(new Set(ids).size, `${archetype.slug} tech ids must be unique`).toBe(ids.length);
		}
	});

	it('preview side: for every archetype, slots resolving to the SAME tech carry pairwise-distinct roles', () => {
		for (const archetype of stackArchetypes) {
			const resolved = resolveArchetypePreview(archetype)!;
			const rolesByTech = new Map<string, string[]>();
			for (const slot of resolved.slots) {
				rolesByTech.set(slot.techId, [...(rolesByTech.get(slot.techId) ?? []), slot.role]);
			}
			for (const [techId, roles] of rolesByTech) {
				expect(
					new Set(roles).size,
					`${archetype.slug}: ${techId} occupies ${roles.length} slots — roles must differ (${roles.join(' / ')})`,
				).toBe(roles.length);
			}
		}
	});

	it("pins the operator example: the pipeline's two Pythons read 'pulls the raw feeds' vs 'cleans & reshapes'", () => {
		const resolved = resolveArchetypePreview(pipeline)!;
		const pythonRoles = resolved.slots.filter((s) => s.techId === 'python').map((s) => s.role);
		expect(pythonRoles).toEqual(['pulls the raw feeds', 'cleans & reshapes']);
	});
});

describe('resolveArchetypePreview', () => {
	it('flip-tags the FIRST slot per resolved tech, exactly once each', () => {
		for (const archetype of stackArchetypes) {
			const resolved = resolveArchetypePreview(archetype)!;
			const flipped = resolved.slots.filter((s) => s.flip).map((s) => s.techId);
			const allTechs = new Set(resolved.slots.map((s) => s.techId));
			expect(new Set(flipped).size, archetype.slug).toBe(flipped.length);
			expect(new Set(flipped), archetype.slug).toEqual(allTechs);
			// And the flip slot is the first occurrence of its tech.
			for (const techId of allTechs) {
				const first = resolved.slots.find((s) => s.techId === techId)!;
				expect(first.flip, `${archetype.slug}: first ${techId} slot carries the flip`).toBe(true);
			}
		}
	});

	it('pick indices land second-of-layer techs in their own slots (round 4)', () => {
		const queries = resolveArchetypePreview(bySlug('queries-that-fly'))!;
		expect(queries.slots.map((s) => s.techId)).toContain('postgresql');
		expect(queries.slots.map((s) => s.techId)).toContain('sql-server');

		const db = resolveArchetypePreview(bySlug('database-that-scales'))!;
		expect(db.slots.map((s) => s.techId)).toContain('alembic');

		const ops = resolveArchetypePreview(bySlug('ops-autopilot'))!;
		expect(ops.slots.map((s) => s.techId)).toContain('docker');
		expect(ops.slots.map((s) => s.techId)).toContain('github-actions');
	});

	it('returns null only for unknown slugs (defensive path)', () => {
		expect(resolveArchetypePreview({ ...dashboard, slug: 'not-a-slug' })).toBeNull();
	});
});

describe('buildComposedPreview — see YOUR build as a product (round 4)', () => {
	const pick = (id: string, layer: StackLayer) => ({ id, layer });

	it('derives the frame from covered layers: site-shaped (interface, no data) → phone, else browser', () => {
		expect(buildComposedPreview([pick('sveltekit', 'interface'), pick('vercel', 'infra')]).frame).toBe('phone');
		expect(buildComposedPreview([pick('sveltekit', 'interface'), pick('postgresql', 'data')]).frame).toBe('browser');
		expect(buildComposedPreview([pick('python', 'logic'), pick('docker', 'infra')]).frame).toBe('browser');
	});

	it('renders one slot per pick — layer-banded, inside the frame, generic layer role, all flip-tagged', () => {
		const picks = [
			pick('sveltekit', 'interface'),
			pick('python', 'logic'),
			pick('typescript', 'logic'),
			pick('postgresql', 'data'),
			pick('docker', 'infra'),
		];
		const composed = buildComposedPreview(picks);
		expect(composed.frame).toBe('browser');
		expect(composed.slots).toHaveLength(picks.length);
		const frame = FRAME_SIZES[composed.frame];
		for (const slot of composed.slots) {
			expect(slot.role).toBe(COMPOSED_ROLES[slot.layer]);
			expect(slot.flip).toBe(true);
			expect(slot.x).toBeGreaterThanOrEqual(0);
			expect(slot.x + slot.w).toBeLessThanOrEqual(frame.w);
			expect(slot.y + slot.h).toBeLessThanOrEqual(frame.h);
		}
		// Two logic picks share the logic band side by side — never overlap.
		const [logicA, logicB] = composed.slots.filter((s) => s.layer === 'logic');
		expect(logicA.y).toBe(logicB.y);
		expect(logicA.x + logicA.w).toBeLessThanOrEqual(logicB.x);
	});

	it('empty picks compose an empty browser frame (defensive — toggle is gated on picks)', () => {
		const composed = buildComposedPreview([]);
		expect(composed.frame).toBe('browser');
		expect(composed.slots).toHaveLength(0);
	});
});

describe('ProductPreview', () => {
	it('renders ≥4 occupied slots for the dashboard seed', () => {
		render(ProductPreview, { props: { archetype: dashboard, animate: false } });
		const preview = screen.getByTestId('product-preview');
		const slots = preview.querySelectorAll('[data-testid^="slot-"]');
		expect(slots.length).toBeGreaterThanOrEqual(4);
		// Every resolved tech is flip-paired exactly once.
		for (const id of ['sveltekit', 'rest-api', 'postgresql', 'docker']) {
			expect(preview.querySelectorAll(`[data-flip-id="${id}"]`)).toHaveLength(1);
		}
	});

	it('slot labels show the occupant tech name', () => {
		render(ProductPreview, { props: { archetype: dashboard, animate: false } });
		const preview = screen.getByTestId('product-preview');
		expect(preview.textContent).toContain('SvelteKit');
		expect(preview.textContent).toContain('PostgreSQL');
		expect(preview.textContent).toContain('Docker');
	});

	it('round 4: a dual-role tech renders BOTH role lines on its slots', () => {
		render(ProductPreview, { props: { archetype: pipeline, animate: false } });
		const preview = screen.getByTestId('product-preview');
		const pythonSlots = screen.getAllByTestId('slot-python');
		expect(pythonSlots).toHaveLength(2);
		expect(preview.textContent).toContain('pulls the raw feeds');
		expect(preview.textContent).toContain('cleans & reshapes');
		// Only the FIRST Python slot is flip-paired.
		expect(preview.querySelectorAll('[data-flip-id="python"]')).toHaveLength(1);
	});

	it('round 4: captions are PER SLOT — tapping the second Python switches the story instead of toggling off', async () => {
		render(ProductPreview, { props: { archetype: pipeline, animate: false } });
		const [source, transform] = screen.getAllByTestId('slot-python');

		await fireEvent.click(source);
		let caption = screen.getByTestId('enables-python');
		expect(caption.textContent).toContain('pulls the raw feeds here');
		expect(caption.textContent).toContain('automates the data work');

		await fireEvent.click(transform);
		caption = screen.getByTestId('enables-python');
		expect(caption.textContent).toContain('cleans & reshapes here');

		// Tapping the SAME slot again toggles the caption away.
		await fireEvent.click(transform);
		expect(screen.queryByTestId('enables-python')).toBeNull();
	});

	it('tapping a slot reads role + enables (en) + layer line into the caption', async () => {
		render(ProductPreview, { props: { archetype: dashboard, animate: false } });
		const slot = screen.getAllByTestId('slot-postgresql')[0];
		await fireEvent.click(slot);
		const caption = screen.getByTestId('enables-postgresql');
		expect(caption.textContent).toContain('where the numbers live here');
		expect(caption.textContent).toContain('stores and queries your data reliably');
		expect(caption.textContent).toContain('data: the remembering part — where records live');
		// Tap again — caption toggles away.
		await fireEvent.click(slot);
		expect(screen.queryByTestId('enables-postgresql')).toBeNull();
	});

	it('renders the phone frame for fast-website', () => {
		render(ProductPreview, { props: { archetype: website, animate: false } });
		const preview = screen.getByTestId('product-preview');
		expect(preview.querySelector('.frame-phone')).toBeTruthy();
		expect(preview.textContent).toContain('TypeScript');
	});

	it('round 4: a NON-SEED archetype previews with both second-of-layer techs distinct', () => {
		render(ProductPreview, { props: { archetype: bySlug('ops-autopilot'), animate: false } });
		const preview = screen.getByTestId('product-preview');
		expect(screen.getByTestId('slot-docker')).toBeTruthy();
		expect(screen.getByTestId('slot-github-actions')).toBeTruthy();
		expect(preview.textContent).toContain('the boxes it runs in');
		expect(preview.textContent).toContain('reruns & alerts');
	});

	it('round 4 composed mode: picks render the generic product (frame + one slot per pick, all flip-tagged)', () => {
		render(ProductPreview, {
			props: {
				picks: [
					{ id: 'node-js', layer: 'logic' as const },
					{ id: 'github-actions', layer: 'infra' as const },
				],
				animate: false,
			},
		});
		const preview = screen.getByTestId('product-preview');
		expect(preview.querySelector('.frame-browser')).toBeTruthy();
		expect(screen.getByTestId('slot-node-js')).toBeTruthy();
		expect(screen.getByTestId('slot-github-actions')).toBeTruthy();
		expect(preview.querySelectorAll('[data-flip-id]')).toHaveLength(2);
		expect(preview.textContent).toContain(COMPOSED_ROLES.logic);
		expect(preview.textContent).toContain(COMPOSED_ROLES.infra);
	});
});
