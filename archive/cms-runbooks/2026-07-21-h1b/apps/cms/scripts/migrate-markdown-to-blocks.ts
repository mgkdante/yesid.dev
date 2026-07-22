#!/usr/bin/env bun
/**
 * Migrate blog markdown files to Editor.js Block Editor JSON for Directus.
 *
 * Slice 18 18f Phase 6. Pure transforms exported for tests; CLI wraps
 * them with file IO + glob.
 *
 * Per AM1: output shape is Editor.js (NOT tiptap). Top-level
 *   { time, blocks, version }, per-block { id, type, data }.
 * Per AM2: inline marks stored as raw HTML strings inside data.text.
 * Per AM3: code blocks have no language attribute (lang hints dropped).
 * Per AM5: multi-paragraph blockquotes emit as N consecutive quote blocks.
 * Per AM6: markdown HR maps to { type: 'delimiter', data: {} }.
 * Per AM2.5: output fixture row is flat — title + excerpt as top-level
 *   fields on the row; no translations array.
 *
 * D15: marked.parse lives ONLY in this CMS-side script (D14 forbids it
 * in @repo/shared and the consumer bundle).
 */

import { marked, type Token, type Tokens } from 'marked';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
	BlockEditorDocSchema,
	type BlockEditorDoc,
	type BlockEditorBlock,
	type NestedListItem,
} from '@repo/shared';

// --- Frontmatter parsing -------------------------------------------------

export interface BlogFrontmatter {
	title?: string;
	excerpt?: string;
	date?: string;
	lang?: 'en' | 'fr' | 'es';
	category?: 'professional' | 'personal';
	tags?: string[];
	animation?: 'draw' | 'morph' | 'draw-fill';
	svg?: string;
	external?: boolean;
	url?: string;
}

export function parseFrontmatter(raw: string): {
	data: BlogFrontmatter & Record<string, unknown>;
	content: string;
} {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) return { data: {}, content: raw };

	const fm = match[1];
	const content = match[2];
	const data: Record<string, unknown> = {};

	for (const line of fm.split(/\r?\n/)) {
		const colonIdx = line.indexOf(':');
		if (colonIdx === -1) continue;
		const key = line.slice(0, colonIdx).trim();
		let value: unknown = line.slice(colonIdx + 1).trim();

		if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
			value = value.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
		}
		if (value === 'true') value = true;
		if (value === 'false') value = false;

		data[key] = value;
	}

	return { data: data as BlogFrontmatter & Record<string, unknown>, content };
}

// --- Block ID generator -------------------------------------------------

let _idCounter = 0;
function nextId(): string {
	_idCounter += 1;
	return `m${_idCounter.toString(36).padStart(8, '0')}`;
}

export function resetIdCounter(): void {
	_idCounter = 0;
}

// --- Inline mark HTML serializer (AM2) ----------------------------------

/**
 * Convert marked inline tokens to an HTML string. Editor.js stores marks
 * as raw HTML inside data.text (paragraph/header/quote/nestedlist items).
 *
 * Supported marks: bold (<b>), italic (<i>), link (<a>), inline code
 * (<code>), strike (<s>), hard break (<br>).
 */
export function inlineToHtml(tokens: Token[]): string {
	const out: string[] = [];
	for (const t of tokens) {
		switch (t.type) {
			case 'text': {
				const tt = t as Tokens.Text;
				// `marked` sometimes provides nested `tokens` (e.g., when text contains formatting).
				// If present, recurse; otherwise emit the raw text.
				if (tt.tokens && tt.tokens.length > 0) {
					out.push(inlineToHtml(tt.tokens));
				} else {
					out.push(escapeHtml(tt.text));
				}
				break;
			}
			case 'strong': {
				out.push(`<b>${inlineToHtml((t as Tokens.Strong).tokens ?? [])}</b>`);
				break;
			}
			case 'em': {
				out.push(`<i>${inlineToHtml((t as Tokens.Em).tokens ?? [])}</i>`);
				break;
			}
			case 'codespan': {
				out.push(`<code>${escapeHtml((t as Tokens.Codespan).text)}</code>`);
				break;
			}
			case 'link': {
				const link = t as Tokens.Link;
				const inner = inlineToHtml(link.tokens ?? []);
				out.push(`<a href="${escapeAttr(link.href)}">${inner}</a>`);
				break;
			}
			case 'del': {
				out.push(`<s>${inlineToHtml((t as Tokens.Del).tokens ?? [])}</s>`);
				break;
			}
			case 'br': {
				out.push('<br>');
				break;
			}
			default: {
				// Fallback: extract text if available
				if ('text' in t && typeof (t as { text: unknown }).text === 'string') {
					out.push(escapeHtml((t as { text: string }).text));
				}
			}
		}
	}
	return out.join('');
}

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
	return escapeHtml(s).replace(/"/g, '&quot;');
}

// --- Strip leading title heading (if matches frontmatter title) ---------

export function stripLeadingTitleHeading(tokens: Token[], title: string): Token[] {
	// Skip leading 'space' tokens — `marked` emits these for blank lines
	// between frontmatter and the body, especially on CRLF-line-ending files.
	let firstIdx = 0;
	while (firstIdx < tokens.length && tokens[firstIdx].type === 'space') {
		firstIdx += 1;
	}
	const first = tokens[firstIdx];
	if (!first || first.type !== 'heading') return tokens;
	const heading = first as Tokens.Heading;
	if (heading.depth !== 1) return tokens;
	if (heading.text.trim().toLowerCase() !== title.trim().toLowerCase()) return tokens;
	// Drop everything up to and including the matched heading, preserving any
	// subsequent space tokens (which `mapToken` handles as no-ops anyway).
	return tokens.slice(firstIdx + 1);
}

// --- Token mapping ------------------------------------------------------

export interface MapOptions {
	stripLeadingTitle?: string;
	assetIdFor?: (legacyPath: string) => string | undefined;
}

/**
 * Map a marked token to one or more Editor.js blocks. Returns:
 *   - null  → skip (token contributes nothing)
 *   - one block (most cases)
 *   - array of blocks (multi-paragraph blockquote per AM5)
 */
function mapToken(token: Token, opts?: MapOptions): BlockEditorBlock | BlockEditorBlock[] | null {
	switch (token.type) {
		case 'heading': {
			const h = token as Tokens.Heading;
			const level = Math.min(6, Math.max(1, h.depth)) as 1 | 2 | 3 | 4 | 5 | 6;
			return {
				id: nextId(),
				type: 'header',
				data: {
					text: inlineToHtml(h.tokens ?? []),
					level,
				},
			};
		}
		case 'paragraph': {
			const p = token as Tokens.Paragraph;
			const inline = p.tokens ?? [];
			// If the paragraph contains a single image, hoist it to a top-level image block.
			if (inline.length === 1 && inline[0].type === 'image') {
				return mapImageToken(inline[0] as Tokens.Image, opts);
			}
			return {
				id: nextId(),
				type: 'paragraph',
				data: { text: inlineToHtml(inline) },
			};
		}
		case 'list': {
			const list = token as Tokens.List;
			const items = list.items.map((item) => listItemToNested(item));
			return {
				id: nextId(),
				type: 'nestedlist',
				data: {
					style: list.ordered ? 'ordered' : 'unordered',
					items,
				},
			};
		}
		case 'code': {
			const code = token as Tokens.Code;
			// AM3: no language attr — lang hint dropped.
			return {
				id: nextId(),
				type: 'code',
				data: { code: code.text },
			};
		}
		case 'blockquote': {
			const bq = token as Tokens.Blockquote;
			// AM5: multi-paragraph blockquote → N consecutive quote blocks (one per paragraph).
			const out: BlockEditorBlock[] = [];
			for (const child of bq.tokens) {
				if (child.type === 'paragraph') {
					out.push({
						id: nextId(),
						type: 'quote',
						data: {
							text: inlineToHtml((child as Tokens.Paragraph).tokens ?? []),
							caption: '',
							alignment: 'left',
						},
					});
				} else if (child.type === 'space') {
					continue;
				} else {
					const mapped = mapToken(child, opts);
					if (mapped) {
						if (Array.isArray(mapped)) out.push(...mapped);
						else out.push(mapped);
					}
				}
			}
			return out.length > 0 ? out : null;
		}
		case 'hr': {
			// AM6: HR → delimiter block
			return {
				id: nextId(),
				type: 'delimiter',
				data: {} as Record<string, never>,
			};
		}
		case 'space': {
			return null;
		}
		case 'html': {
			const h = token as Tokens.HTML;
			return {
				id: nextId(),
				type: 'paragraph',
				data: { text: h.text.trim() },
			};
		}
		default:
			return null;
	}
}

function listItemToNested(item: Tokens.ListItem): NestedListItem {
	const contentParts: string[] = [];
	const nestedItems: NestedListItem[] = [];

	for (const child of item.tokens) {
		if (child.type === 'text') {
			const t = child as Tokens.Text;
			contentParts.push(inlineToHtml(t.tokens ?? [{ type: 'text', text: t.text } as Token]));
		} else if (child.type === 'list') {
			const nested = (child as Tokens.List).items.map((sub) => listItemToNested(sub));
			nestedItems.push(...nested);
		} else if (child.type === 'paragraph') {
			contentParts.push(inlineToHtml((child as Tokens.Paragraph).tokens ?? []));
		} else if (child.type === 'space') {
			continue;
		} else {
			if ('text' in child && typeof (child as { text: unknown }).text === 'string') {
				contentParts.push(escapeHtml((child as { text: string }).text));
			}
		}
	}

	return {
		content: contentParts.join(' '),
		items: nestedItems,
	};
}

function mapImageToken(img: Tokens.Image, opts?: MapOptions): BlockEditorBlock {
	if (!opts?.assetIdFor) {
		throw new Error(`mapMarkdownToBlocks: image found (${img.href}) but no assetIdFor resolver provided`);
	}
	const uuid = opts.assetIdFor(img.href);
	if (!uuid) {
		throw new Error(`mapMarkdownToBlocks: asset not found in id-map for legacy path: ${img.href}`);
	}
	return {
		id: nextId(),
		type: 'image',
		data: {
			file: {
				fileId: uuid,
				fileURL: `/files/${uuid}`,
				url: `/assets/${uuid}`,
			},
			caption: img.text ?? '',
			withBorder: false,
			withBackground: false,
			stretched: false,
		},
	};
}

// --- Top-level transform ------------------------------------------------

export function mapMarkdownToBlocks(content: string, opts?: MapOptions): BlockEditorDoc {
	resetIdCounter();
	const tokens = marked.lexer(content);
	const stripped = opts?.stripLeadingTitle
		? stripLeadingTitleHeading(tokens, opts.stripLeadingTitle)
		: tokens;

	const blocks: BlockEditorBlock[] = [];
	for (const token of stripped) {
		const result = mapToken(token, opts);
		if (result === null) continue;
		if (Array.isArray(result)) blocks.push(...result);
		else blocks.push(result);
	}

	return {
		time: Date.now(),
		version: '2.31.2',
		blocks,
	};
}

// --- Migration over real content ----------------------------------------

interface MigrationOutput {
	id: string;
	frontmatter: BlogFrontmatter;
	body: BlockEditorDoc;
}

function findBlogPosts(blogRoot: string): { slug: string; filepath: string }[] {
	const out: { slug: string; filepath: string }[] = [];
	for (const cat of ['professional', 'personal']) {
		const catDir = join(blogRoot, cat);
		try {
			for (const slug of readdirSync(catDir)) {
				const dir = join(catDir, slug);
				try {
					if (!statSync(dir).isDirectory()) continue;
				} catch {
					continue;
				}
				if (slug.startsWith('_')) continue;
				const filepath = join(dir, 'index.md');
				try {
					statSync(filepath);
				} catch {
					continue;
				}
				out.push({ slug, filepath });
			}
		} catch {
			/* dir doesn't exist; skip */
		}
	}
	return out;
}

export function migrateAllPosts(
	blogRoot: string,
	opts?: { single?: string; assetIdFor?: (path: string) => string | undefined },
): MigrationOutput[] {
	const posts = findBlogPosts(blogRoot);
	const filtered = opts?.single ? posts.filter((p) => p.slug === opts.single) : posts;
	const out: MigrationOutput[] = [];
	for (const { slug, filepath } of filtered) {
		const raw = readFileSync(filepath, 'utf-8');
		const { data, content } = parseFrontmatter(raw);
		const body = mapMarkdownToBlocks(content, {
			stripLeadingTitle: data.title,
			assetIdFor: opts?.assetIdFor,
		});
		out.push({ id: slug, frontmatter: data, body });
	}
	return out;
}

// --- CLI ----------------------------------------------------------------

function parseArgs(argv: readonly string[]): { dryRun: boolean; single?: string; help: boolean } {
	const dryRun = argv.includes('--dry-run');
	const help = argv.includes('--help') || argv.includes('-h');
	const singleIdx = argv.indexOf('--single');
	const single = singleIdx >= 0 ? argv[singleIdx + 1] : undefined;
	return { dryRun, single, help };
}

function printHelp(): void {
	console.log(`migrate-markdown-to-blocks — migrate apps/web/src/content/blog/**/index.md to Editor.js Block Editor JSON.

Usage:
  bun run apps/cms/scripts/migrate-markdown-to-blocks.ts [--dry-run] [--single <slug>]

Flags:
  --dry-run         Print Block Editor JSON for each post; do not write fixture
  --single <slug>   Process only the named post (e.g. --single thinking-in-matrices)
  -h, --help        Show this help

Output (without --dry-run): apps/cms/fixtures/collections/blog-posts.json (overwritten)
Output shape per post (per AM2.5 — flat title+excerpt, no translations array):
  { id, status, date_published, sort, lang, category, tags, external, url,
    cover_image_legacy_path, svg_illustration_id, animation, title, excerpt, body }
`);
}

if (import.meta.main) {
	const args = parseArgs(process.argv.slice(2));
	if (args.help) {
		printHelp();
		process.exit(0);
	}

	const blogRoot = resolve(__dirname, '..', '..', 'web', 'src', 'content', 'blog');
	const fixturePath = resolve(__dirname, '..', 'fixtures', 'collections', 'blog-posts.json');

	const out = migrateAllPosts(blogRoot, { single: args.single });
	console.log(`migrated ${out.length} posts`);

	if (args.dryRun) {
		for (const post of out) {
			console.log(`\n=== ${post.id} ===`);
			console.log(JSON.stringify(post.body, null, 2));
		}
		process.exit(0);
	}

	const rows = out.map((p) => ({
		id: p.id,
		status: 'published',
		date_published: p.frontmatter.date ?? null,
		sort: 0,
		lang: p.frontmatter.lang ?? 'en',
		category: p.frontmatter.category ?? 'professional',
		tags: p.frontmatter.tags ?? [],
		external: p.frontmatter.external ?? false,
		url: p.frontmatter.external ? p.frontmatter.url ?? null : null,
		cover_image_legacy_path: null,
		svg_illustration_id: null,
		animation: p.frontmatter.animation ?? 'draw',
		title: p.frontmatter.title ?? '',
		excerpt: p.frontmatter.excerpt ?? '',
		body: p.body,
	}));

	writeFileSync(fixturePath, JSON.stringify(rows, null, 2) + '\n');
	console.log(`wrote ${fixturePath}`);
}
