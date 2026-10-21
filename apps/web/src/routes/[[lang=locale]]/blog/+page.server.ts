// slice-18i Phase 7C: server-only load threads event.locals.pageCache as ctx
// for loadPage('blog') memoization. The fetch + facet derivation is shared with
// /blog/personal via loadBlogCategory — this route just pins the category.

import { loadBlogCategory } from './blog-category-loader';
import { localeEntries } from '$lib/server/prerender-entries';
import type { EntryGenerator } from './$types';
import { localeFromParams } from '$lib/utils/locale-routing';

export const entries = (() => localeEntries('/blog')) satisfies EntryGenerator;
export const prerender = entries().length > 0;

export async function load({ locals, params }: { locals: App.Locals; params: Record<string, string> }) {
	return loadBlogCategory('professional', localeFromParams(params), {
		pageCache: locals.pageCache,
	});
}
