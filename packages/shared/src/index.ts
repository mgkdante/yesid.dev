// @repo/shared — entry point.
// Exports domain types (content.ts) and Zod schemas (when they land in 18c+).
// Apps consume via: `import type { Service, LocalizedString } from '@repo/shared'`.

export * from './assets';
export * from './types';
export * from './utils';
// export * from './schemas'; // enabled when Zod schemas land (Task 14+ or 18c Phase 3).
