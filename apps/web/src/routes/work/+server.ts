// Redirect only the legacy collection URL; old detail slugs have no guaranteed one-to-one replacements.

import { permanentRedirect } from '#lib/server/redirect.ts';

// Stays on the lambda: permanentRedirect() carries CDN cache headers a
// prerendered redirect entry would lose.
export const prerender = false;

export function GET(): Response {
	return permanentRedirect('/projects');
}
