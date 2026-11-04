import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { localeCopy } from '#lib/locales/index.ts';
import Fixture from './_sections-fixture.svelte';

afterEach(cleanup);

describe('SectionsToggle', () => {
	it.each(['en', 'fr', 'es'] as const)('uses local %s copy and collapses mixed state', async (locale) => {
		const copy = localeCopy[locale].sections;
		render(Fixture, { context: new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]) });
		flushSync();
		const button = screen.getByTestId('sections-toggle');
		expect(button).toHaveAccessibleName(copy.collapse);
		expect(button).toHaveAttribute('title', copy.collapseTitle);
		await fireEvent.click(button);
		expect(button).toHaveAccessibleName(copy.expand);
		expect(button).toHaveAttribute('title', copy.expandTitle);
		const first = screen.getByRole('button', { name: /Section 1/ });
		await fireEvent.click(first);
		expect(first).toHaveAttribute('aria-expanded', 'true');
		expect(button).toHaveAccessibleName(copy.collapse);
		await fireEvent.click(button);
		expect(first).toHaveAttribute('aria-expanded', 'false');
		expect(button).toHaveAccessibleName(copy.expand);
		await fireEvent.click(button);
		expect(first).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getAllByTestId('sections-toggle')).toHaveLength(1);
		expect(screen.getByTestId('sections-controls').querySelectorAll('button')).toHaveLength(1);
	});
	it.each([0, 1])('hides with %i content sections', (count) => {
		render(Fixture, { props: { count } });
		flushSync();
		expect(screen.queryByTestId('sections-toggle')).not.toBeInTheDocument();
	});
});
