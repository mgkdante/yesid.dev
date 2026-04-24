// @yesido/shared — entry point.
// Exports domain types (content.ts) and Zod schemas (when they land in 18c+).
// Apps consume via: `import type { Service, LocalizedString } from '@yesido/shared'`.

export * from './types';
// export * from './schemas'; // enabled when Zod schemas land (Task 14+ or 18c Phase 3).
