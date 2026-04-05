import { getPostsByCategory, getTagsForCategory, getLanguagesForCategory, getSvgContentsForPosts } from '$lib/data';

export function load() {
	const posts = getPostsByCategory('professional');
	const tags = getTagsForCategory('professional');
	const languages = getLanguagesForCategory('professional');
	const svgContents = getSvgContentsForPosts(posts);

	return { posts, tags, languages, svgContents };
}
