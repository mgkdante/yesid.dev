// routeSeoFactory — test data builder for RouteSeoOverride.
//
// First factory in slice-17f. Establishes the hand-rolled-defaults pattern:
//   1. Use interface-forge's base Factory<T> class (not ZodFactory auto-gen)
//   2. Provide explicit defaults that satisfy the Zod schema
//   3. Trust the schema-parse test in factories.test.ts to catch drift
//
// Why hand-rolled instead of ZodFactory:
//   Phase 0 validation showed ZodFactory auto-gen fails on
//   z.string().regex(/^\//) (RouteSeoOverrideSchema.path) and on
//   BlockEditorDoc discriminated unions (ProjectSchema.description). See
//   slice-17f Research page for details.

import { Factory } from 'interface-forge';
import type { RouteSeoOverride } from '$lib/types';

export const routeSeoFactory = new Factory<RouteSeoOverride>(() => ({
	path: '/',
	ogImage: null,
	title: null,
	description: null,
}));
