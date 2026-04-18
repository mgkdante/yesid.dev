import {
	getPostsByCategory,
	getTagsForCategory,
	getLanguagesForCategory,
	getSvgContentsForPosts,
} from '$lib/repositories';

export async function load() {
	const [posts, tags, languages] = await Promise.all([
		getPostsByCategory('professional'),
		getTagsForCategory('professional'),
		getLanguagesForCategory('professional'),
	]);
	const svgContents = await getSvgContentsForPosts(posts);

	return { posts, tags, languages, svgContents };
}
