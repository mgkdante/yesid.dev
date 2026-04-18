import { getPostsByCategory, getTagsForCategory, getLanguagesForCategory, getSvgContentsForPosts } from '$lib/content';
export function load() {
	const posts = getPostsByCategory('personal');
	const tags = getTagsForCategory('personal');
	const languages = getLanguagesForCategory('personal');
	const svgContents = getSvgContentsForPosts(posts);

	return { posts, tags, languages, svgContents };
}
