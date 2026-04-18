// One-line CMS swap point.
// Slice 18 (Payload CMS) is expected to drop a sibling `payload.ts` file and
// flip the re-export below. No other change should be required — repositories
// import from this module, not from individual adapter files.

export { staticAdapter as adapter } from './static';
export type { ContentAdapter } from './types';
