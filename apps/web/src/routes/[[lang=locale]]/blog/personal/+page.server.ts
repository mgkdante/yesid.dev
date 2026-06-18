// /blog/personal — same listing shape as /blog, pinned to the personal
// category. Fetch + facet derivation is shared via loadBlogCategory.

import { loadBlogCategory } from '../blog-category-loader';

export async function load({ locals }: { locals: App.Locals }) {
	return loadBlogCategory('personal', { pageCache: locals.pageCache });
}
