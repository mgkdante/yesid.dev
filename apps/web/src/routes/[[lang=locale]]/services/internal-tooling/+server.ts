// GO-2 Track 3 (services consolidation): internal-tooling archived; its
// promise (kill spreadsheet copy-paste) lives on in Pipelines & Automation,
// so intent-preserving redirect target is /services/data-pipeline.
// See permanentRedirect() for the CDN-edge pattern rationale.

import { permanentRedirect } from '$lib/server/redirect';

// Stays on the lambda: permanentRedirect() carries CDN cache headers a
// prerendered redirect entry would lose.
export const prerender = false;

export function GET(): Response {
	return permanentRedirect('/services/data-pipeline');
}
