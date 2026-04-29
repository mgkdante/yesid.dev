import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Per-request memoization for loadPage(slug, ctx). One Map per HTTP
	// request — multiple content.* calls within the same request resolve
	// through the cache after the first fetch.
	event.locals.pageCache = new Map();

	return resolve(event);
};
