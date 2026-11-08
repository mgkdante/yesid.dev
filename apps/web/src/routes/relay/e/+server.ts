// Plausible events arrive here from this site's own address, so blockers of plausible.io don't
// drop them. The relay forwards each one to Plausible once, with the visitor's IP and user agent.

import { PUBLIC_PLAUSIBLE_DOMAIN } from '$app/env/public';
import { relayAnalyticsEvent } from '@yesid/analytics/relay';
import type { RequestHandler } from './$types';

// Stays on the lambda: every event needs the visitor's address.
export const prerender = false;

export const POST: RequestHandler = ({ request, getClientAddress }) => {
	// Previews and local builds measure nothing, so they have nothing to relay.
	if (!PUBLIC_PLAUSIBLE_DOMAIN) return new Response(null, { status: 404 });
	return relayAnalyticsEvent(request, {
		domain: PUBLIC_PLAUSIBLE_DOMAIN,
		clientAddress: getClientAddress(),
	});
};
