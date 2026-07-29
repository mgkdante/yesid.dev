// Data loader for /tech-stack route.
// slice-18i Phase 7C: converted from universal +page.ts to server-only
// +page.server.ts so we can thread event.locals.pageCache as ctx for
// loadPage('tech-stack') memoization.
//
// Tech items and page chrome come through the adapter (the active swap point)
// from the static content layer post-27.2.

import { adapter } from '$lib/adapters';
import { localeEntries } from '$lib/server/prerender-entries';

export const entries = localeEntries;

export async function load({ locals }: { locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };

	const [items, techStackPage] = await Promise.all([
		adapter.techStack.all(),
		adapter.content.techStackPage(ctx),
	]);

	return { items, techStackPage };
};
