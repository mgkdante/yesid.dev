import { error } from '@sveltejs/kit';
import { getPostBySlug, getPostHtml, getSvgContent } from '$lib/data';

export function load({ params }: { params: { slug: string } }) {
	const post = getPostBySlug(params.slug);
	if (!post) error(404, 'Post not found');

	const html = getPostHtml(params.slug);
	const svgContent = getSvgContent(post);

	// Strip HTML tags, count words, estimate reading time at 200 wpm
	const plainText = html.replace(/<[^>]*>/g, '');
	const wordCount = plainText.split(/\s+/).filter(Boolean).length;
	const readingTime = Math.max(1, Math.ceil(wordCount / 200));

	return { post, html, svgContent, readingTime };
}
