// Engine shell tests (slice-29 Task 8) — mode toggle labels are pinned EXACTLY
// per the spec; regions swap with mode. Subcomponent behaviors get their own
// suites (GoalPicker/TechMatcher/BlueprintCanvas/ProductPreview/BlueprintCTA).

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Engine from './Engine.svelte';

describe('Engine shell', () => {
	it('mounts with data-testid stack-engine', () => {
		render(Engine, { props: { animate: false } });
		expect(screen.getByTestId('stack-engine')).toBeTruthy();
	});

	it("mode toggle labels are EXACTLY 'I want to build…' / 'What can these build?'", () => {
		render(Engine, { props: { animate: false } });
		const goal = screen.getByTestId('mode-toggle-goal');
		const compose = screen.getByTestId('mode-toggle-compose');
		expect(goal.textContent?.trim()).toBe('I want to build…');
		expect(compose.textContent?.trim()).toBe('What can these build?');
	});

	it('starts in goal mode (goal toggle pressed, goal region shown)', () => {
		render(Engine, { props: { animate: false } });
		expect(screen.getByTestId('mode-toggle-goal').getAttribute('aria-pressed')).toBe('true');
		expect(screen.getByTestId('engine-goal-region')).toBeTruthy();
		expect(screen.queryByTestId('engine-compose-region')).toBeNull();
	});

	it('clicking the compose toggle switches regions', async () => {
		render(Engine, { props: { animate: false } });
		await fireEvent.click(screen.getByTestId('mode-toggle-compose'));
		expect(screen.getByTestId('mode-toggle-compose').getAttribute('aria-pressed')).toBe(
			'true',
		);
		expect(screen.getByTestId('engine-compose-region')).toBeTruthy();
		expect(screen.queryByTestId('engine-goal-region')).toBeNull();
	});

	// slice-29 Task 11: blueprint ⇄ preview behind the view toggle. animate=false
	// → plain swap (no Flip), which is exactly what happy-dom can assert.
	it('view toggle swaps blueprint ⇄ preview for the active archetype', async () => {
		render(Engine, { props: { animate: false } });
		await fireEvent.click(screen.getByTestId('archetype-card-data-dashboard'));
		expect(screen.getByTestId('blueprint-canvas')).toBeTruthy();
		expect(screen.queryByTestId('product-preview')).toBeNull();

		await fireEvent.click(screen.getByTestId('view-toggle'));
		expect(screen.getByTestId('product-preview')).toBeTruthy();
		expect(screen.queryByTestId('blueprint-canvas')).toBeNull();

		await fireEvent.click(screen.getByTestId('view-toggle'));
		expect(screen.getByTestId('blueprint-canvas')).toBeTruthy();
		expect(screen.queryByTestId('product-preview')).toBeNull();
	});

	// GO-w2t5 addendum + go2/w5 taste round 2: the section is full-bleed inside
	// the route's engine-band and the inner wrapper is UNCAPPED too (truly
	// edge-to-edge — engine-fullbleed-css.test.ts locks the CSS); this pins the
	// DOM chain the CSS lock assumes.
	it('engine content sits in the (uncapped) engine-inner wrapper', () => {
		render(Engine, { props: { animate: false } });
		const section = screen.getByTestId('stack-engine');
		const inner = section.querySelector(':scope > .engine-inner');
		expect(inner).not.toBeNull();
		expect(inner!.contains(screen.getByTestId('mode-toggle-goal'))).toBe(true);
		expect(inner!.contains(screen.getByTestId('engine-goal-region'))).toBe(true);
	});

	// go2/w5 taste round 2 (operator bug: legend labels rendered "under the
	// line"): the metro track is now an in-flow per-station segment AFTER the
	// printed name — it can never paint over text. Pin the DOM order the CSS
	// relies on: dot → name → track, track decorative.
	it('taste round 2: legend stations print name BEFORE the (decorative) track segment', () => {
		render(Engine, { props: { animate: false } });
		for (const layer of ['interface', 'logic', 'data', 'infra']) {
			const station = screen
				.getByTestId(`legend-${layer}`)
				.querySelector('.legend-station')!;
			// classList[0] — Svelte appends its scoping class after the authored one.
			const children = [...station.children].map((el) => el.classList[0]);
			expect(children).toEqual(['legend-dot', 'legend-name', 'legend-track']);
			expect(station.querySelector('.legend-track')!.getAttribute('aria-hidden')).toBe(
				'true',
			);
			expect(station.querySelector('.legend-name')!.textContent).toBe(layer);
		}
	});

	it('backing out of a blueprint returns to the goal picker', async () => {
		render(Engine, { props: { animate: false } });
		await fireEvent.click(screen.getByTestId('archetype-card-data-dashboard'));
		await fireEvent.click(screen.getByTestId('engine-back'));
		expect(screen.getByTestId('archetype-card-data-dashboard')).toBeTruthy();
		expect(screen.queryByTestId('blueprint-canvas')).toBeNull();
	});

	// Round 4 nav: the '←' is a breadcrumb STEP (preview → blueprint → map),
	// not a jump-home — the view toggle keeps the lateral flip. Labels are
	// homey places, pinned here.
	it('round 4: the back step walks preview → blueprint → map, label naming each place', async () => {
		render(Engine, { props: { animate: false } });
		await fireEvent.click(screen.getByTestId('archetype-card-data-dashboard'));
		const back = () => screen.getByTestId('engine-back');
		expect(back().textContent?.trim()).toBe('← back to the map');

		await fireEvent.click(screen.getByTestId('view-toggle'));
		expect(screen.getByTestId('product-preview')).toBeTruthy();
		expect(back().textContent?.trim()).toBe('← back to the blueprint');

		// Step 1: preview → blueprint (the drawing stays active).
		await fireEvent.click(back());
		expect(screen.getByTestId('blueprint-canvas')).toBeTruthy();
		expect(screen.queryByTestId('product-preview')).toBeNull();
		expect(back().textContent?.trim()).toBe('← back to the map');

		// Step 2: blueprint → the map.
		await fireEvent.click(back());
		expect(screen.getByTestId('archetype-card-data-dashboard')).toBeTruthy();
		expect(screen.queryByTestId('blueprint-canvas')).toBeNull();
	});

	it('round 4: compose entries get the same stepped back', async () => {
		render(Engine, { props: { animate: false } });
		await fireEvent.click(screen.getByTestId('mode-toggle-compose'));
		await fireEvent.click(screen.getByTestId('tech-chip-postgresql'));
		await fireEvent.click(screen.getByTestId('match-card-data-pipeline'));
		expect(screen.getByTestId('blueprint-canvas')).toBeTruthy();
		expect(screen.getByTestId('engine-back').textContent?.trim()).toBe('← back to the map');
		await fireEvent.click(screen.getByTestId('engine-back'));
		// Back on the compose map — chips + cards, picks intact.
		expect(screen.getByTestId('tech-matcher')).toBeTruthy();
		expect(screen.getByTestId('tech-chip-postgresql').getAttribute('aria-pressed')).toBe('true');
	});

	// go2/w5 layered learning: the layer legend persists across goal/compose
	// AND select/blueprint — never unmounted, one cell per STACK_LAYERS entry.
	it('go2/w5: layer legend renders one teaching cell per layer and persists across views', async () => {
		render(Engine, { props: { animate: false } });
		const legend = screen.getByTestId('layer-legend');
		for (const layer of ['interface', 'logic', 'data', 'infra']) {
			expect(screen.getByTestId(`legend-${layer}`)).toBeTruthy();
		}
		expect(legend.textContent).toContain('the part people see and touch');
		expect(legend.textContent).toContain('the thinking part, rules and decisions');
		expect(legend.textContent).toContain('the remembering part, where records live');
		expect(legend.textContent).toContain('the ground it runs on, servers and deploys');

		// Still mounted inside a goal blueprint…
		await fireEvent.click(screen.getByTestId('archetype-card-data-dashboard'));
		expect(screen.getByTestId('layer-legend')).toBeTruthy();

		// …and across the mode switch into compose.
		await fireEvent.click(screen.getByTestId('mode-toggle-compose'));
		expect(screen.getByTestId('layer-legend')).toBeTruthy();
	});
});
