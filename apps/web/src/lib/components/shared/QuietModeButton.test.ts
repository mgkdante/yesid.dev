import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import Fixture from './_quiet-mode-fixture.svelte';
import { quietModeStore } from '$lib/state/quiet-mode.svelte';

describe('QuietModeButton', () => {
	beforeEach(() => {
		localStorage.clear();
		quietModeStore.resetForTest();
		document.documentElement.removeAttribute('data-quiet-mode');
	});

	afterEach(() => {
		cleanup();
		localStorage.clear();
		quietModeStore.resetForTest();
		document.documentElement.removeAttribute('data-quiet-mode');
	});

	it('collapses keyed section cards without saving the page-level toggle', async () => {
		render(Fixture);
		flushSync();

		const button = screen.getByRole('switch', { name: 'Quiet mode' });
		const trigger = screen.getByRole('button', { name: /Fixture Section/i });

		expect(button).toHaveAttribute('aria-checked', 'false');
		expect(trigger).toHaveAttribute('aria-expanded', 'true');

		await fireEvent.click(button);
		flushSync();

		expect(button).toHaveAttribute('aria-checked', 'true');
		expect(localStorage.getItem('quiet-mode')).toBe(null);
		expect(document.documentElement.dataset.quietMode).toBe('true');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('reopens keyed section cards when quiet mode is toggled off', async () => {
		render(Fixture);
		flushSync();

		const button = screen.getByRole('switch', { name: 'Quiet mode' });
		const trigger = screen.getByRole('button', { name: /Fixture Section/i });

		await fireEvent.click(button);
		flushSync();
		expect(trigger).toHaveAttribute('aria-expanded', 'false');

		await fireEvent.click(button);
		flushSync();

		expect(button).toHaveAttribute('aria-checked', 'false');
		expect(document.documentElement.dataset.quietMode).toBeUndefined();
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('saves and forgets quiet mode through the separate remember control', async () => {
		render(Fixture);
		flushSync();

		const quietSwitch = screen.getByRole('switch', { name: 'Quiet mode' });
		const remember = screen.getByRole('button', { name: 'Remember quiet mode' });

		expect(screen.getByText('Remember quiet mode')).toBeTruthy();
		expect(remember).toHaveAttribute('aria-pressed', 'false');

		await fireEvent.click(quietSwitch);
		await fireEvent.click(remember);
		flushSync();

		expect(localStorage.getItem('quiet-mode')).toBe('true');
		expect(remember).toHaveAttribute('aria-pressed', 'true');
		expect(remember).toHaveAttribute('aria-label', 'Forget remembered quiet mode');
		expect(screen.getByText('Forget remembered quiet mode')).toBeTruthy();

		await fireEvent.click(remember);
		flushSync();

		expect(localStorage.getItem('quiet-mode')).toBe(null);
		expect(remember).toHaveAttribute('aria-pressed', 'false');
	});

	it('opens with sections closed when quiet mode was remembered', () => {
		localStorage.setItem('quiet-mode', 'true');

		render(Fixture);
		flushSync();

		const quietSwitch = screen.getByRole('switch', { name: 'Quiet mode' });
		const trigger = screen.getByRole('button', { name: /Fixture Section/i });

		expect(quietSwitch).toHaveAttribute('aria-checked', 'true');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});
});
