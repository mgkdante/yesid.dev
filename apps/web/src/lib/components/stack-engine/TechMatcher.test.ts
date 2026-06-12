// TechMatcher tests (slice-29 Task 9) — written FIRST per TDD.
// Compose-as-matching: chips grouped by layer, picks light archetype match
// cards, and an unusual combo gets a CTA — never a blank state.

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { STACK_LAYERS } from '@repo/shared/schemas';
import TechMatcher from './TechMatcher.svelte';
import { stackArchetypes } from '$lib/content/stack-archetypes';
import { EngineState } from './engine-state.svelte';
import { techStackItems } from '$lib/content/tech-stack';
import { encodeBlueprint } from '$lib/utils/blueprint-param';
import { matchArchetypes } from '$lib/utils/stack-matching';

const usedIds = new Set(stackArchetypes.flatMap((a) => a.tech.map((l) => l.id)));
const unmatchedIds = techStackItems.filter((t) => !usedIds.has(t.id)).map((t) => t.id);
const unmatchedTechId = unmatchedIds[0]!;
const secondUnmatchedId = unmatchedIds[1]!;

describe('TechMatcher chips', () => {
	it('renders a chip per committed tech item', () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		for (const t of techStackItems) {
			expect(screen.getByTestId(`tech-chip-${t.id}`)).toBeTruthy();
		}
	});

	it('groups chips by STACK_LAYERS order (trailing more only when layerless techs exist)', () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		const layerless = techStackItems.find((t) => !t.layer);
		const expectedLayers = [...STACK_LAYERS, ...(layerless ? ['more'] : [])];
		const groups = screen.getAllByTestId(/tech-layer-group-/).map((el) => el.getAttribute('data-testid'));
		expect(groups).toEqual(expectedLayers.map((l) => `tech-layer-group-${l}`).filter((id) => groups.includes(id)));
		// every published tech renders exactly one chip
		for (const t of techStackItems) {
			expect(screen.getByTestId(`tech-chip-${t.id}`)).toBeTruthy();
		}
		if (layerless) {
			const moreGroup = screen.getByTestId('tech-layer-group-more');
			expect(
				moreGroup.querySelector(`[data-testid="tech-chip-${layerless.id}"]`),
			).toBeTruthy();
		}
	});


	it('tapping a chip toggles the pick (pressed state + engine set)', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		const chip = screen.getByTestId('tech-chip-postgresql');
		await fireEvent.click(chip);
		expect(engine.pickedTechs.has('postgresql')).toBe(true);
		expect(chip.getAttribute('aria-pressed')).toBe('true');
		await fireEvent.click(chip);
		expect(engine.pickedTechs.has('postgresql')).toBe(false);
		expect(chip.getAttribute('aria-pressed')).toBe('false');
	});

	it('GO-w2t5: chips and match cards carry tactile press affordances', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		const chip = screen.getByTestId('tech-chip-postgresql');
		expect(chip.className).toContain('tap-press');
		// Label lives on an inner span so the settle keyframe composes with
		// pressBounce's scale tween on the button itself.
		expect(chip.querySelector('.chip-label')?.textContent).toBe('PostgreSQL');

		await fireEvent.click(chip);
		const card = screen.getByTestId('match-card-data-pipeline');
		expect(card.className).toContain('tap-press');
	});
});

describe('TechMatcher match cards', () => {
	it('lights archetype cards with "<title> — <matched>/<stackSize>" sorted by coverage', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		await fireEvent.click(screen.getByTestId('tech-chip-docker'));

		// Data-driven (go-day matrix: archetype set grows with the portfolio):
		// the rendered card order must mirror the matching engine exactly.
		const expected = matchArchetypes(['postgresql', 'docker'], stackArchetypes);
		const cards = screen.getAllByTestId(/^match-card-/);
		expect(cards.map((c) => c.getAttribute('data-testid'))).toEqual(
			expected.map((m) => `match-card-${m.slug}`),
		);
		const top = expected[0];
		expect(screen.getByTestId(`match-card-${top.slug}`).textContent).toContain(
			`— ${top.matched.length}/${top.matched.length + top.missing.length}`,
		);
	});

	it('clicking a match card opens that archetype blueprint', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		await fireEvent.click(screen.getByTestId('match-card-data-pipeline'));
		expect(engine.activeArchetype).toBe('data-pipeline');
		expect(engine.view).toBe('blueprint');
	});

	it('shows no match cards and no zero-match CTA before any pick (but never blank)', () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		expect(screen.queryAllByTestId(/^match-card-/)).toHaveLength(0);
		expect(screen.queryByTestId('zero-match-cta')).toBeNull();
		// Never a blank state: the matcher always renders its chip groups.
		expect(screen.getAllByTestId(/^tech-layer-group-/).length).toBeGreaterThan(0);
	});
});

describe('TechMatcher zero-match state', () => {
	it('shows the exact unusual-combo card + prefilled contact link', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		// derive a published tech no archetype uses → picked.size>0 && matches.length===0.
		await fireEvent.click(screen.getByTestId(`tech-chip-${unmatchedTechId}`));
		expect(engine.matches).toHaveLength(0);

		const cta = screen.getByTestId('zero-match-cta');
		expect(cta.textContent).toContain(
			"Unusual combo — I like it. Tell me what you're after.",
		);
		const link = cta.querySelector('a');
		expect(link?.getAttribute('href')).toBe(
			'/contact?bp=' + encodeBlueprint({ archetype: null, techs: [unmatchedTechId] }),
		);
	});

	it('zero-match link carries every picked tech', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId(`tech-chip-${unmatchedTechId}`));
		await fireEvent.click(screen.getByTestId(`tech-chip-${secondUnmatchedId}`));
		const link = screen.getByTestId('zero-match-cta').querySelector('a');
		expect(link?.getAttribute('href')).toBe('/contact?bp=' + encodeBlueprint({ archetype: null, techs: [unmatchedTechId, secondUnmatchedId] }));
	});

	it('zero-match card disappears once a pick matches an archetype', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId(`tech-chip-${unmatchedTechId}`));
		expect(screen.getByTestId('zero-match-cta')).toBeTruthy();
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		expect(screen.queryByTestId('zero-match-cta')).toBeNull();
		expect(screen.getByTestId('match-card-data-pipeline')).toBeTruthy();
	});
});
