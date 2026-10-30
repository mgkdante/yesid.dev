import { permanentRedirect } from '#lib/server/redirect.ts';
import { localeFromParams, localizeHref } from '#lib/utils/locale-routing.ts';
import type { RequestHandler } from './$types';

// Stays on the lambda: permanentRedirect() carries CDN cache headers a
// prerendered redirect entry would lose.
export const prerender = false;

export const GET: RequestHandler = ({ params }) =>
	permanentRedirect(localizeHref('/services', localeFromParams(params)));
