// Data loader for /tech-stack route.
// slice-18i Phase 7C: converted from universal +page.ts to server-only
// +page.server.ts so we can thread event.locals.pageCache as ctx for
// loadPage('tech-stack') memoization.
//
// Tech items come from the adapter (static content layer post-27.2) via the
// repository boundary. Page chrome (techStackPage) flows through the adapter.

import {
	getAllTechItems,
	getTechStackPageContent,
} from '$lib/repositories';
import { localeEntries } from '$lib/server/prerender-entries';

export const entries = localeEntries;

export async function load({ locals }: { locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };

	const [items, techStackPage] = await Promise.all([
		getAllTechItems(),
		getTechStackPageContent(ctx),
	]);

	return { items, techStackPage };
};
