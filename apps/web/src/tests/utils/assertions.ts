// L4 assertion helpers — slice-17f Phase 4.
//
// Three helpers in one module:
//   expectValidSchema(value, schema)   — Zod-powered runtime validator with
//                                         friendly error messages
//   expectAccessibleHeading(rendered, level, name?)
//                                       — wraps Testing Library's heading query
//   expectStructuralMatch(rendered, structure)
//                                       — asserts a set of test-ids exist
//
// Consumer pattern:
//   import { expectValidSchema, expectAccessibleHeading } from '$tests/utils';
//
//   expectValidSchema(adapterResult, ProjectSchema);
//   expectAccessibleHeading(rendered, 1, /yesid/i);

import type { ZodSchema } from 'zod';
import type { RenderResult } from '@testing-library/svelte';

/**
 * Assert a value satisfies a Zod schema. Type-narrows on success.
 * Throws with the Zod error message on failure (more readable than a
 * raw `safeParse` consumer).
 *
 * @example
 *   const project = adapter.projects.byId('foo');
 *   expectValidSchema(project, ProjectSchema);
 *   // Now `project` is narrowed to Project
 */
export function expectValidSchema<T>(value: unknown, schema: ZodSchema<T>): asserts value is T {
	const result = schema.safeParse(value);
	if (!result.success) {
		throw new Error(`Schema validation failed:\n${result.error.message}`);
	}
}

/**
 * Get a heading element by level + optional accessible name. Wraps
 * `getByRole('heading', { level, name })` — Testing Library best practice.
 *
 * @example
 *   expectAccessibleHeading(rendered, 1, /pipelines that don't break/i);
 */
export function expectAccessibleHeading(
	rendered: RenderResult,
	level: number,
	name?: string | RegExp,
): HTMLElement {
	return rendered.getByRole('heading', { level, name });
}

/**
 * Assert that every test-id in `structure.testIds` is present in the
 * rendered DOM. Errors name the missing id for fast diagnosis.
 *
 * @example
 *   expectStructuralMatch(rendered, {
 *     testIds: ['app-root', 'hero-banner', 'metro-network-container'],
 *   });
 */
export function expectStructuralMatch(
	rendered: RenderResult,
	structure: { testIds: string[] },
): void {
	for (const id of structure.testIds) {
		const el = rendered.queryByTestId(id);
		if (el === null) {
			throw new Error(`missing test-id: ${id}`);
		}
	}
}
