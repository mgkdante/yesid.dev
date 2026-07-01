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
// Directus vars in CI — stubbing to empty {} keeps $env-importing modules
// (e.g. $lib/directus/assets, the live media-URL seam) safe to evaluate at
// the top level. Tests that need a value mock the module locally.
//
// The dormant directus-adapter mock that used to live here was removed at
// slice-26 close together with $lib/adapters/directus itself (Directus 12
// verified on both environments; the git history holds the module).
vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));
// $env/static/public resolves from the local .env at transform time, so its
// contents differ between dev machines and CI. Stub for determinism (vitest's
// mock proxy throws on any key absent from the factory, so list every var the
// app touches); tests that need a real value mock the module locally.
vi.mock('$env/static/public', () => ({ PUBLIC_DIRECTUS_URL: '' }));
