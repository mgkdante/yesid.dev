// assertions.test.ts — verifies the L4 assertion helpers behave correctly.

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { render } from '@testing-library/svelte';
import {
	expectValidSchema,
	expectAccessibleHeading,
	expectStructuralMatch,
} from './assertions';
import ErrorPage from '../../routes/+error.svelte';

describe('expectValidSchema', () => {
	const PersonSchema = z.object({ name: z.string(), age: z.number() });

	it('passes for a valid value', () => {
		expect(() => expectValidSchema({ name: 'Yesid', age: 30 }, PersonSchema)).not.toThrow();
	});

	it('throws with a friendly error for invalid value', () => {
		expect(() => expectValidSchema({ name: 'Yesid' }, PersonSchema)).toThrow(/age/);
	});

	it('type-narrows on success (compile-time check)', () => {
		const value: unknown = { name: 'Yesid', age: 30 };
		expectValidSchema(value, PersonSchema);
		// After the assertion, `value` is narrowed — these compile only because
		// of the `asserts` signature.
		const name: string = value.name;
		const age: number = value.age;
		expect(name).toBe('Yesid');
		expect(age).toBe(30);
	});
});

describe('expectAccessibleHeading', () => {
	const stubData = { status: 404, error: { message: 'gone' } };

	it('returns the heading element at the requested level', () => {
		const rendered = render(ErrorPage, { props: { data: stubData } as never });
		const h1 = expectAccessibleHeading(rendered, 1);
		expect(h1).toBeInTheDocument();
		expect(h1.tagName.toLowerCase()).toBe('h1');
	});
});

describe('expectStructuralMatch', () => {
	const stubData = { status: 404, error: { message: 'gone' } };

	it('passes when every expected test-id is present', () => {
		const rendered = render(ErrorPage, { props: { data: stubData } as never });
		expect(() =>
			expectStructuralMatch(rendered, { testIds: ['construction-scene'] }),
		).not.toThrow();
	});

	it('throws with the missing test-id named in the error', () => {
		const rendered = render(ErrorPage, { props: { data: stubData } as never });
		expect(() =>
			expectStructuralMatch(rendered, { testIds: ['no-such-id'] }),
		).toThrow(/no-such-id/);
	});
});
