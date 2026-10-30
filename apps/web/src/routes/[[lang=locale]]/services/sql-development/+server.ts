// This static segment shadows [id] so the indexed legacy service URL redirects instead of returning 404.

import { permanentRedirect } from '#lib/server/redirect.ts';

// Stays on the lambda: permanentRedirect() carries CDN cache headers a
// prerendered redirect entry would lose.
export const prerender = false;

export function GET(): Response {
	return permanentRedirect('/services/database-engineering');
}
