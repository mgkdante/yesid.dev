import type { BlogPost } from './types.js';

// Simple frontmatter parser that works in the browser (no Node.js Buffer needed).
// Extracts YAML-like frontmatter between --- delimiters.
function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
	const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) return { data: {}, content: raw };

	const frontmatter = match[1];
	const content = match[2];
	const data: Record<string, unknown> = {};

	for (const line of frontmatter.split('\n')) {
		const colonIdx = line.indexOf(':');
		if (colonIdx === -1) continue;
		const key = line.slice(0, colonIdx).trim();
		let value: unknown = line.slice(colonIdx + 1).trim();

		// Parse arrays: [a, b, c]
		if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
			value = value.slice(1, -1).split(',').map((s) => s.trim());
		}
		// Parse booleans
		if (value === 'true') value = true;
		if (value === 'false') value = false;

		data[key] = value;
	}

	return { data, content };
}

// Import all markdown files from the blog content directory at build time.
// Vite resolves these eagerly — no runtime file system access needed.
const rawPosts = import.meta.glob('/src/content/blog/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

// Parse frontmatter from each markdown file and build typed BlogPost objects.
const blogPosts: readonly BlogPost[] = Object.entries(rawPosts).map(([filepath, raw]) => {
	const { data, content } = parseFrontmatter(raw);
	const filename = filepath.split('/').pop()?.replace('.md', '') ?? '';

	return {
		slug: filename,
		title: { en: (data.title as string) ?? '' },
		excerpt: { en: (data.excerpt as string) ?? '' },
		date: String(data.date ?? ''),
		tags: Array.isArray(data.tags) ? data.tags : [],
		url: data.external ? (data.url as string ?? `/blog/${filename}`) : `/blog/${filename}`,
		external: data.external === true
	};
});

/**
 * Returns the N most recent blog posts, sorted by date descending.
 */
export function getLatestPosts(count: number): readonly BlogPost[] {
	return [...blogPosts]
		.sort((a, b) => b.date.localeCompare(a.date))
		.slice(0, count);
}

/**
 * Returns a single blog post by slug, or undefined if not found.
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
	return blogPosts.find((p) => p.slug === slug);
}

export { blogPosts };
