// Minimal setup for the "data" Vitest project.
// Data-layer tests run in Node environment (no DOM) and only need
// jest-dom matchers for assertion compatibility.

import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Force the hybrid adapter to behave as all-static during data-layer tests.
//
// The production adapter at $lib/adapters/index.ts composes services from
// directusAdapter with the rest from staticAdapter (port-by-port migration,
// Slice 18 Task 7). Without this mock, any test that transitively invokes
// adapter.services.* would try to fetch from cms.yesid.dev — fails fast
// because PUBLIC_DIRECTUS_URL isn't set in the test env.
//
// Mocking ./directus at module-load swaps directusAdapter for staticAdapter,
// so $lib/adapters/index.ts wires the static services port into the hybrid.
// Repository tests then exercise the static implementation as they always
// have; the contract shape is unchanged (enforced by ContentAdapter type).
//
// Directus integration testing lives outside vitest — the seed script's
// verify step (scripts/seed-directus-services.ts) + manual browser smoke
// against cms.yesid.dev cover the live path.
// Same $env stubs as DOM tests (see setup.dom.ts for rationale). Data-tier
// tests run in Node so process.env exists, but it's not populated with the
// Directus vars in CI — stubbing to empty {} keeps the adapter-module top-level
// imports safe; the directus-adapter mock below short-circuits actual use.
vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));

vi.mock('$lib/adapters/directus', async () => {
	// Preserve every real export (toLocalizedString, types) so unit tests for
	// the Directus adapter's pure helpers still work — override ONLY the
	// directusAdapter export so repository tests routed through the hybrid
	// pick up staticAdapter behaviour.
	const original = await vi.importActual<typeof import('$lib/adapters/directus')>(
		'$lib/adapters/directus',
	);
	const { staticAdapter } = await vi.importActual<typeof import('$lib/adapters/static')>(
		'$lib/adapters/static',
	);
	return { ...original, directusAdapter: staticAdapter };
});
