import type { ParamMatcher } from '@sveltejs/kit';

// SvelteKit param matcher for the OG endpoint's `type` segment.
// Restricts /og/[type]/... to known content types.
export const match: ParamMatcher = (value) =>
  value === 'blog' || value === 'project';
