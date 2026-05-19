// render.test.ts — verifies the L3 render fixtures work with real Svelte 5
// components.
//
// Uses +error.svelte (root error page) as the test subject because it's
// simple, has no data dependencies beyond `data`, and exists.

import { describe, expect } from 'vitest';
import { test } from './render';
import ErrorPage from '../../routes/+error.svelte';

describe('renderRoute fixture', () => {
	test('renders a route component with provided data', ({ renderRoute }) => {
		const { getByRole } = renderRoute(ErrorPage, {
			status: 404,
			error: { message: 'gone' },
		});
		expect(getByRole('heading', { level: 1 })).toBeInTheDocument();
	});
});

describe('renderWithLayout fixture', () => {
	test('renders a component via the layout pass-through', ({ renderWithLayout }) => {
		const { getByRole } = renderWithLayout(ErrorPage, {
			status: 404,
			error: { message: 'gone' },
		});
		expect(getByRole('heading', { level: 1 })).toBeInTheDocument();
	});
});

describe('multi-fixture destructuring', () => {
	test('both fixtures resolve in the same test scope', ({ renderRoute, renderWithLayout }) => {
		expect(typeof renderRoute).toBe('function');
		expect(typeof renderWithLayout).toBe('function');
	});
});
