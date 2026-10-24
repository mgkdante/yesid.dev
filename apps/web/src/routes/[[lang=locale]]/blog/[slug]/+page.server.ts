import { error } from '@sveltejs/kit';
import { adapter } from '$lib/adapters';
import { extractHeadings, extractText, wordCount, readingTime } from '@repo/shared';
import { blogEntries } from '$lib/server/prerender-entries';
import { collectCodeHighlights } from '$lib/server/code-highlights';
import { getBlogPostsForLocale } from '$lib/blog/translations';
import { localeFromParams } from '$lib/utils/locale-routing';

export const entries = blogEntries;
export const prerender = entries().length > 0;

export async function load({
	params,
}: {
	params: { slug: string; lang?: string };
}) {
	const locale = localeFromParams(params);
	const post = await adapter.blog.bySlug(params.slug);
	if (!post || post.lang !== locale) error(404, 'Post not found');

	const [body, svgContent, allPosts, blogPage] = await Promise.all([
		adapter.blog.bodyBySlug(params.slug),
		adapter.blog.svgContent(post),
		adapter.blog.all(),
		adapter.content.blogPage(),
	]);

	if (!body) error(404, 'Post body missing');

	const text = extractText(body);
	const words = wordCount(text);
	const minutesToRead = readingTime(words);
	const headings = extractHeadings(body);

	const localePosts = getBlogPostsForLocale(allPosts, locale);
	const postIndex = localePosts.findIndex((candidate) => candidate.slug === post.slug) + 1;

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
