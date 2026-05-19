// L3 render helpers — Vitest `test.extend()` fixtures for Svelte 5 components.
//
// Slice-17f Phase 3. Verified working in Phase 0 against the real
// +error.svelte component (see Research page).
//
// Consumer pattern:
//   import { test } from '$tests/utils';  // OR: '../../tests/utils' (relative)
//
//   test('home page renders', ({ renderRoute }) => {
//     const { getByRole } = renderRoute(HomePage, stubData);
//     expect(getByRole('heading', { level: 1 })).toBeInTheDocument();
//   });
//
// Why fixtures instead of bare functions:
//   - Lazy: only initialized when destructured (no overhead for tests that
//     don't use them)
//   - Composable: tests can destructure multiple fixtures from the same context
//   - Typed: builder syntax gives auto-inference
//   - Cleanable: `onCleanup` callback if a fixture needs teardown (none needed
//     here yet)

import { test as base } from 'vitest';
import { render, type RenderResult } from '@testing-library/svelte';
import type { Component } from 'svelte';

// Svelte 5's Component<Props> requires `Props extends Record<string, any>`.
// We don't constrain the data shape directly — tests pass arbitrary route
// data objects — so the type alias below loosens the constraint to a generic
// record. The `as never` cast in render() handles SvelteKit's typed-load
// shape mismatch (TestingLibrary's render expects Props directly, not
// wrapped in `{ data }`).
type ComponentProps = Record<string, unknown>;

interface RenderFixtures {
	/**
	 * Render a route component with the provided `data` prop (mimics
	 * SvelteKit's `+page.svelte` data flow). Returns the standard
	 * @testing-library/svelte RenderResult.
	 */
	renderRoute: <Props extends ComponentProps = ComponentProps>(
		component: Component<Props>,
		data: ComponentProps,
	) => RenderResult<Component<Props>>;

	/**
	 * Render a component as if it were wrapped in the root layout. Currently
	 * a thin pass-through to render() — extend if layout-context is needed
	 * (e.g., providing nav slots, theme context, etc.).
	 */
	renderWithLayout: <Props extends ComponentProps = ComponentProps>(
		component: Component<Props>,
		data: ComponentProps,
	) => RenderResult<Component<Props>>;
}

export const test = base.extend<RenderFixtures>({
	// eslint-disable-next-line no-empty-pattern
	renderRoute: async ({}, use) => {
		const fn: RenderFixtures['renderRoute'] = (component, data) =>
			render(component, { props: { data } } as never);
		await use(fn);
	},

	// eslint-disable-next-line no-empty-pattern
	renderWithLayout: async ({}, use) => {
		const fn: RenderFixtures['renderWithLayout'] = (component, data) =>
			render(component, { props: { data } } as never);
		await use(fn);
	},
});
