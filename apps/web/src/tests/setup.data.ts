// Minimal setup for the "data" Vitest project.
// Data-layer tests run in Node environment (no DOM) and only need
// jest-dom matchers for assertion compatibility.

import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { faker } from '@faker-js/faker';

// Seed faker for reproducible CI; individual tests can override the seed.
faker.seed(42);

// Keep runtime environment imports deterministic and prevent weather requests.
// Tests that exercise a configured key can override this mock locally.
vi.mock('$app/env/private', () => ({ OPENWEATHER_API_KEY: '' }));
vi.mock('$app/env/public', () => ({ PUBLIC_DIRECTUS_URL: '' }));
