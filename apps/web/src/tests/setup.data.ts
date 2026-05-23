// Minimal setup for the "data" Vitest project.
// Data-layer tests run in Node environment (no DOM) and only need
// jest-dom matchers for assertion compatibility.

import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { faker } from '@faker-js/faker';

// Deterministic faker output for CI reproducibility (slice-17f L1 prerequisite).
// Override per-test with `faker.seed(<n>)` if non-determinism is intentional.
// Seed value 42 is arbitrary but stable.
faker.seed(42);

// Same $env stubs as DOM tests (see setup.dom.ts for rationale). Data-tier
// tests run in Node so process.env exists, but it's not populated with the
// Directus vars in CI — stubbing to empty {} keeps adapter-module top-level
// imports safe; the directus-adapter mock below short-circuits actual use.
vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));

// Force the hybrid adapter to behave as all-static during data-layer tests.
//
// The production adapter at $lib/adapters/index.ts composes `services` from
// `directusAdapter` with the rest from `staticAdapter` (port-by-port
// migration, Slice 18 Task 7). Without this mock, any test that transitively
// invokes `adapter.services.*` would try to fetch from cms.yesid.dev and fail
// fast because PUBLIC_DIRECTUS_URL is empty in test env.
//
// Why mock at `$lib/adapters/directus` rather than `$lib/adapters` (the
// composite): meta.ts uses a late-binding `await import('$lib/adapters')`
// inside route-SEO resolvers, and Vitest's `vi.importActual` (used by any
// composite-level mock to reach `staticAdapter`) creates a graph whose
// transitive dynamic imports bypass the composite mock. Mocking directus
// directly is strictly module-local and avoids the escape hatch.
//
// Contract tests for directus.ts unmock this path at the top of the file
// via `vi.unmock('$lib/adapters/directus')` so the subject-under-test is
// never polluted (18c Task 44 / F6).
vi.mock('$lib/adapters/directus', async () => {
	// Preserve every real export (toLocalizedString, types, toService, helpers)
	// so unit tests for the Directus adapter's pure helpers still work —
	// override ONLY the `directusAdapter` export so repository tests routed
	// through the hybrid composite pick up staticAdapter behaviour.
	const original = await vi.importActual<typeof import('$lib/adapters/directus')>(
		'$lib/adapters/directus',
	);
	const { staticAdapter } = await vi.importActual<typeof import('$lib/adapters/static')>(
		'$lib/adapters/static',
	);
	return { ...original, directusAdapter: staticAdapter };
});
