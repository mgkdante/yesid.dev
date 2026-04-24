import { describe, it, expect } from 'bun:test';
import { generateTypes } from './generate-types';

// Pure unit tests for generate-types.ts focus on the exports + signature.
// End-to-end emission tested via `bun scripts/generate-types.ts` against
// live CMS (needs admin creds; run manually or in CI per Task 39).

describe('scripts/generate-types.ts', () => {
	it('exports generateTypes as an async function', () => {
		expect(typeof generateTypes).toBe('function');
		// Async functions are AsyncFunction constructor
		expect(generateTypes.constructor.name).toBe('AsyncFunction');
	});
});
