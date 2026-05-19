// Barrel re-exports for slice-17f L3 + L4 — render fixtures + assertion helpers.
//
// Per gap-fix #3 in the slice-17f Plan addendum: L3 (render fixtures) and
// L4 (assertion helpers) live together in tests/utils/ to keep the
// directory count low and make onboarding cheaper.
//
// Consumer pattern:
//   import { test, expectValidSchema, expectAccessibleHeading } from '$tests/utils';
//
//   test('home page', ({ renderRoute }) => {
//     const rendered = renderRoute(HomePage, stubData);
//     expectAccessibleHeading(rendered, 1, /yesid/i);
//   });

// L3 — render fixtures (Vitest test.extend())
export { test } from './render';

// L4 — assertion helpers
export {
	expectValidSchema,
	expectAccessibleHeading,
	expectStructuralMatch,
} from './assertions';
