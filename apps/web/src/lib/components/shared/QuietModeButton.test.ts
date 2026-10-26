import { siteLabels } from '#lib/content/site-labels.ts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import Fixture from './_quiet-mode-fixture.svelte';
import { quietMode } from '@yesid/ui/state';

const localizedCases = (['fr', 'es'] as const).map(locale => ({
	locale,
	collapse: siteLabels.a11y.quietModeLabel[locale]!,
	expand: siteLabels.a11y.quietModeLabelCollapsed[locale]!,
	collapseTitle: siteLabels.a11y.quietModeEnable[locale]!,
	expandTitle: siteLabels.a11y.quietModeDisable[locale]!,
	remember: siteLabels.a11y.quietModeRemember[locale]!,
	forget: siteLabels.a11y.quietModeForget[locale]!,
}));

// Homework #19b: both controls are plain buttons whose accessible name IS the
// visible verb label ("Collapse all" / "Expand all"), flipping with state.
// State styling hooks moved from aria-checked/aria-pressed to
// data-collapsed/data-remembered because the flipping name already announces
// the state (role="switch" would double-encode it).
describe('QuietModeButton', () => {
	beforeEach(() => {
		localStorage.clear();
		quietMode.resetForTest();
		document.documentElement.removeAttribute('data-quiet-mode');
	});

	afterEach(() => {
		cleanup();
		localStorage.clear();
		quietMode.resetForTest();
		document.documentElement.removeAttribute('data-quiet-mode');
	});

	it('collapses keyed section cards without saving the page-level toggle', async () => {
		render(Fixture);
		flushSync();

		const button = screen.getByTestId('quiet-mode-toggle');
		const trigger = screen.getByRole('button', { name: /Fixture Section/i });

		expect(button).toHaveAttribute('data-collapsed', 'false');
		expect(trigger).toHaveAttribute('aria-expanded', 'true');

		await fireEvent.click(button);
		flushSync();

		expect(button).toHaveTextContent(siteLabels.a11y.quietModeLabelCollapsed.en);
		expect(button).toHaveAttribute('data-collapsed', 'true');
		expect(localStorage.getItem('quiet-mode')).toBe(null);
		expect(document.documentElement.dataset.quietMode).toBe('true');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('reopens keyed section cards when the toggle flips back to expand', async () => {
		render(Fixture);
		flushSync();

		const button = screen.getByTestId('quiet-mode-toggle');
		const trigger = screen.getByRole('button', { name: /Fixture Section/i });

		await fireEvent.click(button);
		flushSync();
		expect(trigger).toHaveAttribute('aria-expanded', 'false');

		await fireEvent.click(button);
		flushSync();

		expect(button).toHaveTextContent(siteLabels.a11y.quietModeLabel.en);
		expect(button).toHaveAttribute('data-collapsed', 'false');
		expect(document.documentElement.dataset.quietMode).toBeUndefined();
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('saves and forgets the collapsed default through the separate persist control', async () => {
		render(Fixture);
		flushSync();

		const collapseToggle = screen.getByTestId('quiet-mode-toggle');
		const remember = screen.getByTestId('quiet-mode-remember');

		expect(screen.getByTestId('quiet-mode-remember')).toHaveTextContent(siteLabels.a11y.quietModeRemember.en);
		expect(remember).toHaveAttribute('data-remembered', 'false');

		await fireEvent.click(collapseToggle);
		await fireEvent.click(remember);
		flushSync();

		expect(localStorage.getItem('quiet-mode')).toBe('true');
		expect(remember).toHaveAttribute('data-remembered', 'true');
		expect(screen.getByTestId('quiet-mode-remember')).toHaveTextContent(siteLabels.a11y.quietModeForget.en);

		await fireEvent.click(remember);
		flushSync();

		expect(localStorage.getItem('quiet-mode')).toBe(null);
		expect(remember).toHaveAttribute('data-remembered', 'false');
		expect(screen.getByTestId('quiet-mode-remember')).toHaveTextContent(siteLabels.a11y.quietModeRemember.en);
	});

	it('opens with sections closed when the collapsed default was remembered', () => {
		localStorage.setItem('quiet-mode', 'true');
		quietMode.init();

		render(Fixture);
		flushSync();

		const collapseToggle = screen.getByTestId('quiet-mode-toggle');
		const trigger = screen.getByRole('button', { name: /Fixture Section/i });

		expect(collapseToggle).toHaveAttribute('data-collapsed', 'true');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it.each(localizedCases)(
		'preserves CMS-backed $locale labels and titles through the package view',
		async ({ locale, collapse, expand, collapseTitle, expandTitle, remember, forget }) => {
			render(Fixture, {
				context: new Map([[Symbol.for('yesid.locale'), () => locale]]),
			});
			flushSync();

			const collapseToggle = screen.getByTestId('quiet-mode-toggle');
			const rememberToggle = screen.getByTestId('quiet-mode-remember');
			expect(collapseToggle).toHaveAccessibleName(collapse);
			expect(collapseToggle).toHaveAttribute('title', collapseTitle);
			expect(rememberToggle).toHaveAccessibleName(remember);
			expect(rememberToggle).toHaveAttribute('title', remember);

			await fireEvent.click(collapseToggle);
			flushSync();
			expect(screen.getByTestId('quiet-mode-toggle')).toHaveAccessibleName(expand);
			expect(screen.getByTestId('quiet-mode-toggle')).toHaveAttribute('title', expandTitle);

			await fireEvent.click(rememberToggle);
			flushSync();
			expect(screen.getByTestId('quiet-mode-remember')).toHaveAccessibleName(forget);
			expect(screen.getByTestId('quiet-mode-remember')).toHaveAttribute('title', forget);
		},
	);
});
