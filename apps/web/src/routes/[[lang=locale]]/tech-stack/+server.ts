// Slice 43.2 (owner decision D7): the retired technology page redirects to
// Services in the requested locale.
//
// See permanentRedirect() (slice-28.1 audit #24): a raw Response because
// redirect() can't carry headers, and this permanent redirect should serve
// from the CDN edge (s-maxage=86400) rather than invoking the lambda per hit.

import { permanentRedirect } from '$lib/server/redirect';
import { localeFromParams, localizeHref } from '$lib/utils/locale-routing';
import type { RequestHandler } from './$types';

// Stays on the lambda: permanentRedirect() carries CDN cache headers a
// prerendered redirect entry would lose.
export const prerender = false;

export const GET: RequestHandler = ({ params }) =>
	permanentRedirect(localizeHref('/services', localeFromParams(params)));
