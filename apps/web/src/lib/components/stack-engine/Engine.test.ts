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
});
