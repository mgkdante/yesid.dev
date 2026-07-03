import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import Fixture from './_quiet-mode-fixture.svelte';
import { quietModeStore } from '$lib/state/quiet-mode.svelte';

// Homework #19b: both controls are plain buttons whose accessible name IS the
// visible verb label ("Collapse all" / "Expand all"), flipping with state.
// State styling hooks moved from aria-checked/aria-pressed to
// data-collapsed/data-remembered because the flipping name already announces
// the state (role="switch" would double-encode it).
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

		const button = screen.getByRole('button', { name: 'Collapse all' });
		const trigger = screen.getByRole('button', { name: /Fixture Section/i });

		expect(button).toHaveAttribute('data-collapsed', 'false');
		expect(trigger).toHaveAttribute('aria-expanded', 'true');

		await fireEvent.click(button);
		flushSync();

		expect(button).toHaveTextContent('Expand all');
		expect(button).toHaveAttribute('data-collapsed', 'true');
		expect(localStorage.getItem('quiet-mode')).toBe(null);
		expect(document.documentElement.dataset.quietMode).toBe('true');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('reopens keyed section cards when the toggle flips back to expand', async () => {
		render(Fixture);
		flushSync();

		const button = screen.getByRole('button', { name: 'Collapse all' });
		const trigger = screen.getByRole('button', { name: /Fixture Section/i });

		await fireEvent.click(button);
		flushSync();
		expect(trigger).toHaveAttribute('aria-expanded', 'false');

		await fireEvent.click(button);
		flushSync();

		expect(button).toHaveTextContent('Collapse all');
		expect(button).toHaveAttribute('data-collapsed', 'false');
		expect(document.documentElement.dataset.quietMode).toBeUndefined();
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('saves and forgets the collapsed default through the separate persist control', async () => {
		render(Fixture);
		flushSync();

		const collapseToggle = screen.getByRole('button', { name: 'Collapse all' });
		const remember = screen.getByRole('button', { name: 'Always start collapsed' });

		expect(screen.getByText('Always start collapsed')).toBeTruthy();
		expect(remember).toHaveAttribute('data-remembered', 'false');

		await fireEvent.click(collapseToggle);
		await fireEvent.click(remember);
		flushSync();

		expect(localStorage.getItem('quiet-mode')).toBe('true');
		expect(remember).toHaveAttribute('data-remembered', 'true');
		expect(screen.getByText("Don't start collapsed")).toBeTruthy();

		await fireEvent.click(remember);
		flushSync();

		expect(localStorage.getItem('quiet-mode')).toBe(null);
		expect(remember).toHaveAttribute('data-remembered', 'false');
		expect(screen.getByText('Always start collapsed')).toBeTruthy();
	});

	it('opens with sections closed when the collapsed default was remembered', () => {
		localStorage.setItem('quiet-mode', 'true');

		render(Fixture);
		flushSync();

		const collapseToggle = screen.getByRole('button', { name: 'Expand all' });
		const trigger = screen.getByRole('button', { name: /Fixture Section/i });

		expect(collapseToggle).toHaveAttribute('data-collapsed', 'true');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});
});
