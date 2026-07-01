import { error } from '@sveltejs/kit';
import {
	getAllPosts,
	getPostBySlug,
	getPostBody,
	getSvgContent,
	getBlogPageContent,
} from '$lib/repositories';
import { extractHeadings, extractText, wordCount, readingTime } from '@repo/shared';
import { blogEntries } from '$lib/server/prerender-entries';
import { collectCodeHighlights } from '$lib/server/code-highlights';

export const entries = blogEntries;

export async function load({ params, locals }: { params: { slug: string }; locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };
	const post = await getPostBySlug(params.slug, ctx);
	if (!post) error(404, 'Post not found');

	const [body, svgContent, allPosts, blogPage] = await Promise.all([
		getPostBody(params.slug, ctx),
		getSvgContent(post, ctx),
		getAllPosts(ctx),
		getBlogPageContent(ctx),
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
		blogPage,
		// Shiki runs server-side only; CodeBlock consumes these by block id.
		codeHighlights: collectCodeHighlights([body]),
	};
}
