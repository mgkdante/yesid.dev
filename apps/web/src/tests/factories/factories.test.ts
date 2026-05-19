// factories.test.ts — coverage for all slice-17f L1 test data factories.
//
// Each factory describe block follows the same 3-test shape:
//   1. produces a value that satisfies its Zod schema
//   2. respects overrides
//   3. batch() produces N valid instances
//
// The schema-parse-on-build check is the drift guard: if a schema changes
// (e.g., new required field added), the factory test fails immediately,
// forcing the factory defaults to be updated alongside the schema.

import { describe, it, expect } from 'vitest';
import { RouteSeoOverrideSchema } from '$lib/schemas/route-seo';
import { routeSeoFactory } from './route-seo.factory';

describe('routeSeoFactory', () => {
	it('produces a value that satisfies RouteSeoOverrideSchema', () => {
		const seo = routeSeoFactory.build();
		expect(() => RouteSeoOverrideSchema.parse(seo)).not.toThrow();
	});

	it('respects overrides', () => {
		const seo = routeSeoFactory.build({ path: '/about' });
		expect(seo.path).toBe('/about');
		expect(() => RouteSeoOverrideSchema.parse(seo)).not.toThrow();
	});

	it('batch produces N valid instances', () => {
		const ten = routeSeoFactory.batch(10);
		expect(ten).toHaveLength(10);
		ten.forEach((s) => expect(() => RouteSeoOverrideSchema.parse(s)).not.toThrow());
	});
});
