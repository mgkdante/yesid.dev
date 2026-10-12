import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import ListingShell from './ListingShell.svelte';

describe('ListingShell', () => {
	it.each(['Notes', 'Un catalogue de travaux et de recherches', ''])(
		'preserves supplied edge title and child content: %s',
		(edgeTitle) => {
			render(ListingShell, {
				edgeTitle,
				children: createRawSnippet(() => ({
					render: () => '<a href="/fixture-detail">Open a result</a>',
				})),
			});
			expect(document.querySelector('.edge-title')?.textContent).toBe(`${edgeTitle}.`);
			expect(screen.getByRole('link', { name: 'Open a result' })).toHaveAttribute(
				'href',
				'/fixture-detail',
			);
		},
	);
});
