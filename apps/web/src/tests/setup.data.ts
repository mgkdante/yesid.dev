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

// Keep runtime environment imports deterministic and prevent weather requests.
// Tests that exercise a configured key can override this mock locally.
vi.mock('$app/env/private', () => ({ OPENWEATHER_API_KEY: '' }));
vi.mock('$app/env/public', () => ({ PUBLIC_DIRECTUS_URL: '' }));
