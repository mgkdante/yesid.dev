// slice-18i Phase 7C: server-only load threads event.locals.pageCache as ctx
// for loadPage('blog') memoization. The fetch + facet derivation is shared with
// /blog/personal via loadBlogCategory — this route just pins the category.

import { loadBlogCategory } from './blog-category-loader';

export async function load({ locals }: { locals: App.Locals }) {
	return loadBlogCategory('professional', { pageCache: locals.pageCache });
}
