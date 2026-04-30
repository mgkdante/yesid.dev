// slice-18i Phase 7C: converted from universal +page.ts to server-only
// +page.server.ts so we can thread event.locals.pageCache as ctx for
// loadPage('blog') memoization and add blogPage chrome content.

import {
	getPostsByCategory,
	getTagsForCategory,
	getLanguagesForCategory,
	getSvgContentsForPosts,
	getBlogPageContent,
} from '$lib/repositories';

export async function load({ locals }: { locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };

	const [posts, tags, languages, blogPage] = await Promise.all([
		getPostsByCategory('professional', ctx),
		getTagsForCategory('professional', ctx),
		getLanguagesForCategory('professional', ctx),
		getBlogPageContent(ctx),
	]);
	const svgContents = await getSvgContentsForPosts(posts, ctx);

	return { posts, tags, languages, svgContents, blogPage };
};
