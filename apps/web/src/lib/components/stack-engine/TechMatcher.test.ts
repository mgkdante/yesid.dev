// TechMatcher tests (slice-29 Task 9) — written FIRST per TDD.
// Compose-as-matching: chips grouped by layer, picks light archetype match
// cards, and an unusual combo gets a CTA — never a blank state.

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { STACK_LAYERS } from '@repo/shared/schemas';
import TechMatcher from './TechMatcher.svelte';
import { EngineState } from './engine-state.svelte';
import { techStackItems } from '$lib/content/tech-stack';
import { encodeBlueprint } from '$lib/utils/blueprint-param';

describe('TechMatcher chips', () => {
	it('renders a chip per committed tech item', () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		for (const t of techStackItems) {
			expect(screen.getByTestId(`tech-chip-${t.id}`)).toBeTruthy();
		}
	});

	it('groups chips by STACK_LAYERS order with layerless techs under trailing more', () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		const groups = screen.getAllByTestId(/^tech-layer-group-/);
		const expectedOrder = [...STACK_LAYERS, 'more'].map((l) => `tech-layer-group-${l}`);
		expect(groups.map((g) => g.getAttribute('data-testid'))).toEqual(expectedOrder);

		// Layered techs sit in their layer group…
		const dataGroup = screen.getByTestId('tech-layer-group-data');
		expect(dataGroup.querySelector('[data-testid="tech-chip-postgresql"]')).toBeTruthy();
		// …layerless techs land under 'more'.
		const layerless = techStackItems.find((t) => !t.layer);
		expect(layerless, 'fixture expects at least one layerless tech').toBeTruthy();
		const moreGroup = screen.getByTestId('tech-layer-group-more');
		expect(
			moreGroup.querySelector(`[data-testid="tech-chip-${layerless!.id}"]`),
		).toBeTruthy();
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

		// postgresql+docker → pipeline 2/3 beats dashboard 2/4.
		const cards = screen.getAllByTestId(/^match-card-/);
		expect(cards.map((c) => c.getAttribute('data-testid'))).toEqual([
			'match-card-data-pipeline',
			'match-card-data-dashboard',
		]);
		expect(screen.getByTestId('match-card-data-pipeline').textContent).toContain(
			'A data pipeline — 2/3',
		);
		expect(screen.getByTestId('match-card-data-dashboard').textContent).toContain(
			'A data dashboard — 2/4',
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
		// 'dax' belongs to no launch archetype → picked.size>0 && matches.length===0.
		await fireEvent.click(screen.getByTestId('tech-chip-dax'));
		expect(engine.matches).toHaveLength(0);

		const cta = screen.getByTestId('zero-match-cta');
		expect(cta.textContent).toContain(
			"Unusual combo — I like it. Tell me what you're after.",
		);
		const link = cta.querySelector('a');
		expect(link?.getAttribute('href')).toBe(
			'/contact?bp=' + encodeBlueprint({ archetype: null, techs: ['dax'] }),
		);
	});

	it('zero-match link carries every picked tech', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId('tech-chip-dax'));
		await fireEvent.click(screen.getByTestId('tech-chip-ssis'));
		const link = screen.getByTestId('zero-match-cta').querySelector('a');
		expect(link?.getAttribute('href')).toBe('/contact?bp=custom~dax.ssis');
	});

	it('zero-match card disappears once a pick matches an archetype', async () => {
		const engine = new EngineState();
		render(TechMatcher, { props: { engine } });
		await fireEvent.click(screen.getByTestId('tech-chip-dax'));
		expect(screen.getByTestId('zero-match-cta')).toBeTruthy();
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		expect(screen.queryByTestId('zero-match-cta')).toBeNull();
		expect(screen.getByTestId('match-card-data-pipeline')).toBeTruthy();
	});
});
