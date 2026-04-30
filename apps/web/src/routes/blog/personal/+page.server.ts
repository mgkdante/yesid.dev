import {
	getPostsByCategory,
	getTagsForCategory,
	getLanguagesForCategory,
	getSvgContentsForPosts,
} from '$lib/repositories';

export async function load({ locals }: { locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };
	const [posts, tags, languages] = await Promise.all([
		getPostsByCategory('personal', ctx),
		getTagsForCategory('personal', ctx),
		getLanguagesForCategory('personal', ctx),
	]);
	const svgContents = await getSvgContentsForPosts(posts, ctx);

	return { posts, tags, languages, svgContents };
}
