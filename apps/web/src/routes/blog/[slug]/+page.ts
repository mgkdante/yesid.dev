import { error } from '@sveltejs/kit';
import {
	getAllPosts,
	getPostBySlug,
	getPostBody,
	getSvgContent,
} from '$lib/repositories';
import { extractHeadings, extractText, wordCount, readingTime } from '@repo/shared';

export async function load({ params }: { params: { slug: string } }) {
	const post = await getPostBySlug(params.slug);
	if (!post) error(404, 'Post not found');

	const [body, svgContent, allPosts] = await Promise.all([
		getPostBody(params.slug),
		getSvgContent(post),
		getAllPosts(),
	]);

	if (!body) error(404, 'Post body missing');

	const text = extractText(body);
	const words = wordCount(text);
	const minutesToRead = readingTime(words);
	const headings = extractHeadings(body);

	const postIndex = allPosts.findIndex((p) => p.slug === post.slug) + 1;

	return {
		post,
		body,
		svgContent,
		readingTime: minutesToRead,
		wordCount: words,
		headings,
		postIndex,
	};
}
