// GoalPicker tests (slice-29 Task 9) — written FIRST per TDD.
// Goal mode entry: one card per archetype (title + hook), click → blueprint.

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import GoalPicker from './GoalPicker.svelte';
import { EngineState } from './engine-state.svelte';
import { stackArchetypes } from '$lib/content/stack-archetypes';

describe('GoalPicker', () => {
	it('renders one card per archetype with the slug testid', () => {
		const engine = new EngineState();
		render(GoalPicker, { props: { engine } });
		for (const a of stackArchetypes) {
			expect(screen.getByTestId(`archetype-card-${a.slug}`)).toBeTruthy();
		}
	});

	it('cards show the en title + hook', () => {
		const engine = new EngineState();
		render(GoalPicker, { props: { engine } });
		const card = screen.getByTestId('archetype-card-data-dashboard');
		expect(card.textContent).toContain('A data dashboard');
		expect(card.textContent).toContain('See your numbers move.');
	});

	it('clicking a card selects the archetype and moves to the blueprint view', async () => {
		const engine = new EngineState();
		render(GoalPicker, { props: { engine } });
		await fireEvent.click(screen.getByTestId('archetype-card-data-dashboard'));
		expect(engine.activeArchetype).toBe('data-dashboard');
		expect(engine.view).toBe('blueprint');
	});

	it('GO-w2t5: archetype cards carry tactile press affordances', () => {
		const engine = new EngineState();
		render(GoalPicker, { props: { engine } });
		expect(screen.getByTestId('archetype-card-data-dashboard').className).toContain(
			'tap-press',
		);
	});
});
