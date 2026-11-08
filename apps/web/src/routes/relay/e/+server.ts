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
		clientAddress: visitorAddress(request, getClientAddress),
	});
};

// Cloudflare proxies yesid.dev to Vercel, so Vercel's client address is a Cloudflare server, and
// Plausible drops events from data-centre addresses. Cloudflare sets CF-Connecting-IP to the
// visitor's address on every proxied request. A request that skips Cloudflare could set it
// itself, but that only picks the address of an event the sender could send from anywhere.
function visitorAddress(request: Request, getClientAddress: () => string): string {
	return request.headers.get('cf-connecting-ip')?.trim() || getClientAddress();
}
