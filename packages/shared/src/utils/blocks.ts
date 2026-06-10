// Pure helpers for working with Block Editor (Editor.js) docs.
//
// Slice-18 18f Phase 3 (Tasks 11–16). All helpers consume + return
// values consistent with `packages/shared/src/types/blocks.ts` types.
//
// Per D14: types + Zod + pure utils only. No `$lib`/app-specific imports.
// No async; no I/O. Pure transforms — same input → same output.
//
// Per AM2 (decisions.md): inline marks live as raw HTML inside `data.text`
// (paragraphs / headers / quote / nestedlist items). Helpers strip HTML
// when extracting plain text; preserve HTML when serializing back to HTML.

import type {
	BlockEditorDoc,
	BlockEditorBlock,
	NestedListItem,
	TocHeading,
} from '../types/blocks';

// ---------------------------------------------------------------------------
// kebabSlug — text → kebab-case ASCII slug
// ---------------------------------------------------------------------------

/**
 * Slugify a heading or label into kebab-case ASCII.
 * Used for deterministic heading ids in BlockRenderer + extractHeadings.
 */
export function kebabSlug(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/[\s-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// stripHtml — internal helper, removes tags from a HTML string
// ---------------------------------------------------------------------------

/**
 * Strip HTML tags from a string. Used to extract plain text from Editor.js
 * `data.text` fields (which embed inline marks as <b>, <i>, <a>, etc.).
 *
 * Naive regex-based implementation — sufficient for Editor.js's tightly
 * scoped inline-mark HTML (no script/style/comment tags emitted).
 */
export function stripHtml(html: string): string {
	return html
		.replace(/<[^>]*>/g, '')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ');
}

// ---------------------------------------------------------------------------
// extractText — walk doc.blocks, concat plain text
// ---------------------------------------------------------------------------

/**
 * Walk an Editor.js doc and concatenate all plain text content.
 * Block boundaries become single spaces; horizontal rules / images
 * contribute caption only (or empty string).
 */
export function extractText(doc: BlockEditorDoc): string {
	const parts: string[] = [];
	for (const block of doc.blocks) {
		const text = blockText(block);
		if (text) parts.push(text);
	}
	return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function blockText(block: BlockEditorBlock): string {
	switch (block.type) {
		case 'header':
			return stripHtml(block.data.text);
		case 'paragraph':
			return stripHtml(block.data.text);
		case 'code':
			return block.data.code;
		case 'quote': {
			const text = stripHtml(block.data.text);
			const caption = block.data.caption ? stripHtml(block.data.caption) : '';
			return caption ? `${text} ${caption}` : text;
		}
		case 'nestedlist':
			return nestedListText(block.data.items);
		case 'image':
			return block.data.caption ? stripHtml(block.data.caption) : '';
		case 'delimiter':
			return '';
		default:
			return '';
	}
}

function nestedListText(items: NestedListItem[]): string {
	const parts: string[] = [];
	for (const item of items) {
		parts.push(stripHtml(item.content));
		if (item.items.length > 0) {
			parts.push(nestedListText(item.items));
		}
	}
	return parts.join(' ');
}

// ---------------------------------------------------------------------------
// wordCount — whitespace-separated token count
// ---------------------------------------------------------------------------

/**
 * Count whitespace-separated tokens. Returns 0 for empty / whitespace-only.
 */
export function wordCount(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/\s+/).length;
}

// ---------------------------------------------------------------------------
// readingTime — minutes-to-read estimate
// ---------------------------------------------------------------------------

/**
 * Reading-time estimate in minutes. Default 200 WPM (industry-standard
 * for narrative copy). Returns at least 1.
 */
export function readingTime(words: number, wpm = 200): number {
	if (words <= 0) return 1;
	return Math.max(1, Math.ceil(words / wpm));
}

// ---------------------------------------------------------------------------
// extractHeadings — walk doc, emit TOC entries with deterministic ids
// ---------------------------------------------------------------------------

/**
 * Walk a doc and emit a flat TOC with deterministic ids.
 * Slug derived from `kebabSlug(stripHtml(text))`. Collision suffix
 * (-2, -3, ...) appended for duplicate slugs (e.g., two "Setup" sections).
 */
export function extractHeadings(doc: BlockEditorDoc): readonly TocHeading[] {
	const out: TocHeading[] = [];
	const counts = new Map<string, number>();
	for (const block of doc.blocks) {
		if (block.type !== 'header') continue;
		const text = stripHtml(block.data.text);
		const baseId = kebabSlug(text);
		const seen = counts.get(baseId) ?? 0;
		counts.set(baseId, seen + 1);
		const id = seen === 0 ? baseId : `${baseId}-${seen + 1}`;
		out.push({ id, text, level: block.data.level });
	}
	return out;
}

// ---------------------------------------------------------------------------
// wrapPlainText — string → single-or-multi-paragraph Editor.js doc
// ---------------------------------------------------------------------------

/**
 * Wrap a plain-text string in an Editor.js doc. Splits on double newlines
 * to form multiple paragraph blocks; preserves single-newline whitespace
 * verbatim (no <br> conversion; treat as wrapped prose).
 *
 * Used by #41 to migrate `projects_translations.description` and
 * `projects_sections_translations.content` (currently plain strings) into
 * the Block Editor field shape without authoring effort.
 */
export function wrapPlainText(str: string): BlockEditorDoc {
	const time = Date.now();
	const version = '2.31.2';
	if (!str) {
		return {
			time,
			version,
			blocks: [
				{ id: 'p1', type: 'paragraph', data: { text: '' } },
			],
		};
	}
	const paragraphs = str.split(/\n\s*\n/);
	return {
		time,
		version,
		blocks: paragraphs.map((text, i) => ({
			id: `p${i + 1}`,
			type: 'paragraph' as const,
			data: { text },
		})),
	};
}

// ---------------------------------------------------------------------------
// serializeBlocksToHtml — Editor.js doc → HTML string
// ---------------------------------------------------------------------------

/**
 * Serialize an Editor.js doc to an HTML string. LIVE in the static adapter
 * (the runtime content layer post-27.2): `static.blog.html()` and the
 * tech-stack search-text flattening both call it, and the dormant
 * directus adapter + cms export emitters mirror the same serialization.
 * (An earlier note called this a "legacy bridge to be removed in 18i" —
 * inverted: the static adapter became the live adapter and kept it.)
 *
 * Inline marks (already HTML inside data.text) pass through as-is.
 * External links rendered without rel/target — relies on Block Editor
 * input sanitization. Code blocks escape entities (raw plain text input).
 */
export function serializeBlocksToHtml(doc: BlockEditorDoc): string {
	const counts = new Map<string, number>();
	return doc.blocks.map((block) => blockHtml(block, counts)).join('');
}

function blockHtml(block: BlockEditorBlock, counts: Map<string, number>): string {
	switch (block.type) {
		case 'header': {
			const plain = stripHtml(block.data.text);
			const baseId = kebabSlug(plain);
			const seen = counts.get(baseId) ?? 0;
			counts.set(baseId, seen + 1);
			const id = seen === 0 ? baseId : `${baseId}-${seen + 1}`;
			return `<h${block.data.level} id="${id}">${block.data.text}</h${block.data.level}>`;
		}
		case 'paragraph':
			return `<p>${block.data.text}</p>`;
		case 'code':
			return `<pre><code>${escapeText(block.data.code)}</code></pre>`;
		case 'quote': {
			const cite = block.data.caption
				? `<cite>${block.data.caption}</cite>`
				: '';
			return `<blockquote><p>${block.data.text}</p>${cite}</blockquote>`;
		}
		case 'nestedlist':
			return renderList(block.data.style, block.data.items);
		case 'image':
			return `<img src="${escapeAttr(block.data.file.url)}" alt="${escapeAttr(block.data.caption)}">`;
		case 'delimiter':
			return '<hr>';
		default:
			return '';
	}
}

function renderList(
	style: 'unordered' | 'ordered',
	items: NestedListItem[],
): string {
	const tag = style === 'unordered' ? 'ul' : 'ol';
	const inner = items
		.map((item) => {
			let html = `<li>${item.content}`;
			if (item.items.length > 0) {
				html += renderList(style, item.items);
			}
			html += '</li>';
			return html;
		})
		.join('');
	return `<${tag}>${inner}</${tag}>`;
}

function escapeText(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
	return escapeText(s).replace(/"/g, '&quot;');
}
