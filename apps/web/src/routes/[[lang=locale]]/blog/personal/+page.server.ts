// /blog/personal — same listing shape as /blog, pinned to the personal
// category. Fetch + facet derivation is shared via loadBlogCategory.

import { loadBlogCategory } from '../blog-category-loader';
import { localeEntries } from '$lib/server/prerender-entries';
import { localeFromParams } from '$lib/utils/locale-routing';

export const entries = localeEntries;

export async function load({ locals, params }: { locals: App.Locals; params: Record<string, string> }) {
	return loadBlogCategory('personal', localeFromParams(params), {
		pageCache: locals.pageCache,
	});
}
