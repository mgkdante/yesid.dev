// Shared server-load body for the two blog listing routes (/blog and
// /blog/personal). They differ ONLY by post category, so the fetch + facet
// derivation lives here once and each +page.server.ts is a one-line call.
// Plain .ts (no `+` prefix) so SvelteKit does not treat it as a route.

import {
	getPostsByCategory,
	getSvgContentsForPosts,
	getBlogPageContent,
} from '$lib/repositories';
import { uniqueSorted } from '$lib/utils';
import type { Locale } from '$lib/types';

type BlogCategory = Parameters<typeof getPostsByCategory>[0];
type LoadCtx = { pageCache: App.Locals['pageCache'] };

export async function loadBlogCategory(category: BlogCategory, ctx: LoadCtx) {
	const [posts, blogPage] = await Promise.all([
		getPostsByCategory(category, ctx),
		getBlogPageContent(ctx),
	]);
	const svgContents = await getSvgContentsForPosts(posts, ctx);
	const tags = uniqueSorted(posts.flatMap((post) => post.tags));
	const languages = uniqueSorted(posts.map((post) => post.lang)) as readonly Locale[];

	return { posts, tags, languages, svgContents, blogPage };
}
