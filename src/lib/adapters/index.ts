// One-line CMS swap point.
// Slice 18 (Directus CMS — pivoted from Payload 2026-04-22) lands a sibling
// adapter file and flips the re-export below. No other change should be
// required — repositories import from this module, not from individual
// adapter files.

export { staticAdapter as adapter } from './static';
export type { ContentAdapter } from './types';
