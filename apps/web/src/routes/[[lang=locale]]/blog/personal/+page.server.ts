import {
	getPostsByCategory,
	getSvgContentsForPosts,
	getBlogPageContent,
} from '$lib/repositories';
import type { BlogPost, Locale } from '$lib/types';

function tagsFromPosts(posts: readonly BlogPost[]): readonly string[] {
	return [...new Set(posts.flatMap((post) => post.tags))].sort();
}

function languagesFromPosts(posts: readonly BlogPost[]): readonly Locale[] {
	return [...new Set(posts.map((post) => post.lang))].sort() as Locale[];
}

export async function load({ locals }: { locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };
	const [posts, blogPage] = await Promise.all([
		getPostsByCategory('personal', ctx),
		getBlogPageContent(ctx),
	]);
	const svgContents = await getSvgContentsForPosts(posts, ctx);
	const tags = tagsFromPosts(posts);
	const languages = languagesFromPosts(posts);

	return { posts, tags, languages, svgContents, blogPage };
}
