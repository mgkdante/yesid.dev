import { error } from '@sveltejs/kit';
import {
	getAllPosts,
	getPostBySlug,
	getPostHtml,
	getSvgContent,
} from '$lib/repositories';

export async function load({ params }: { params: { slug: string } }) {
	const post = await getPostBySlug(params.slug);
	if (!post) error(404, 'Post not found');

	const [rawHtml, svgContent, allPosts] = await Promise.all([
		getPostHtml(params.slug),
		getSvgContent(post),
		getAllPosts(),
	]);

	// Strip the first <h1> from rendered HTML — BlogDetailHeader already shows the title
	const html = rawHtml.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, '');

	// Strip HTML tags, count words, estimate reading time at 200 wpm
	const plainText = html.replace(/<[^>]*>/g, '');
	const wordCount = plainText.split(/\s+/).filter(Boolean).length;
	const readingTime = Math.max(1, Math.ceil(wordCount / 200));

	const postIndex = allPosts.findIndex((p) => p.slug === post.slug) + 1;

	return { post, html, svgContent, readingTime, postIndex };
}
