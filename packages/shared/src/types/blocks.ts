// Block Editor document types + Zod schema.
//
// Slice-18 18f Phase 3 Task 10. Models Directus 11.17.3 Block Editor
// (Editor.js v2.31.x) JSON shape.
//
// Per D14: types + Zod only. No runtime helpers in `types/`; pure utils
// live in `utils/blocks.ts`.
//
// Per D15: Block Editor is the only CMS rich-content interface in slice-18+.
// `BlockRenderer.svelte` (slice-18 18f Phase 10) is the single source of
// truth for rendering CMS rich content. (`marked` does survive in apps/web,
// but only for the GitHub-README import path on project detail pages — not
// for any CMS-authored content.)
//
// Per AM1 (slice-18f decisions, Notion): shape locked against the live P3 probe — Editor.js,
// not tiptap. Top-level: { time, blocks, version }. Per-block: { id, type, data }.
// Inline marks (bold/italic/link/etc.) are stored as RAW HTML strings inside
// `data.text` (paragraph + header + nestedlist items). Code blocks have NO
// language attribute (AM3 — drop language hints). Embeds not configured (AM4).

import { z } from 'zod';
import type { LocalizedBlockEditorDoc } from './content';

// ---------------------------------------------------------------------------
// Block-specific types
// ---------------------------------------------------------------------------

export interface HeaderBlock {
	id: string;
	type: 'header';
	data: {
		text: string;          // raw HTML — Editor.js stores marks inline
		level: 1 | 2 | 3 | 4 | 5 | 6;
	};
}

export interface ParagraphBlock {
	id: string;
	type: 'paragraph';
	data: {
		text: string;          // raw HTML — Editor.js stores marks inline
	};
}

export interface NestedListItem {
	content: string;           // raw HTML
	items: NestedListItem[];   // recursive — empty array for leaf items
}

export interface NestedListBlock {
	id: string;
	type: 'nestedlist';
	data: {
		style: 'unordered' | 'ordered';
		items: NestedListItem[];
	};
}

export interface CodeBlock {
	id: string;
	type: 'code';
	data: {
		code: string;          // raw plain text — NO language attr (AM3)
	};
}

export interface QuoteBlock {
	id: string;
	type: 'quote';
	data: {
		text: string;          // raw HTML — flat single text (no nested paragraphs)
		caption: string;
		alignment: 'left' | 'center' | 'right';
	};
}

export interface ImageBlockFile {
	fileId: string;            // Directus file UUID
	fileURL: string;           // /files/<uuid>
	url: string;               // /assets/<uuid>
	width?: number;
	height?: number;
	size?: string;
	name?: string;
	title?: string;
	extension?: string;
}

export interface ImageBlock {
	id: string;
	type: 'image';
	data: {
		file: ImageBlockFile;
		variants?: {
			light?: ImageBlockFile;
		};
		caption: string;
		withBorder: boolean;
		withBackground: boolean;
		stretched: boolean;
	};
}

export interface DelimiterBlock {
	id: string;
	type: 'delimiter';
	data: Record<string, never>;  // empty object — Editor.js delimiter has no payload
}

// Discriminated union of all known block types
export type BlockEditorBlock =
	| HeaderBlock
	| ParagraphBlock
	| NestedListBlock
	| CodeBlock
	| QuoteBlock
	| ImageBlock
	| DelimiterBlock;

// ---------------------------------------------------------------------------
// Top-level doc
// ---------------------------------------------------------------------------

export interface BlockEditorDoc {
	time: number;              // ms-precision timestamp set by Editor.js
	blocks: BlockEditorBlock[];
	version: string;           // Editor.js semver, e.g. "2.31.2"
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const HeaderBlockSchema: z.ZodType<HeaderBlock> = z.object({
	id: z.string(),
	type: z.literal('header'),
	data: z.object({
		text: z.string(),
		level: z.union([
			z.literal(1),
			z.literal(2),
			z.literal(3),
			z.literal(4),
			z.literal(5),
			z.literal(6),
		]),
	}),
});

export const ParagraphBlockSchema: z.ZodType<ParagraphBlock> = z.object({
	id: z.string(),
	type: z.literal('paragraph'),
	data: z.object({
		text: z.string(),
	}),
});

// Recursive lazy schema for nested-list items
export const NestedListItemSchema: z.ZodType<NestedListItem> = z.lazy(() =>
	z.object({
		content: z.string(),
		items: z.array(NestedListItemSchema),
	}),
);

export const NestedListBlockSchema: z.ZodType<NestedListBlock> = z.object({
	id: z.string(),
	type: z.literal('nestedlist'),
	data: z.object({
		style: z.enum(['unordered', 'ordered']),
		items: z.array(NestedListItemSchema),
	}),
});

export const CodeBlockSchema: z.ZodType<CodeBlock> = z.object({
	id: z.string(),
	type: z.literal('code'),
	data: z.object({
		code: z.string(),
	}),
});

export const QuoteBlockSchema: z.ZodType<QuoteBlock> = z.object({
	id: z.string(),
	type: z.literal('quote'),
	data: z.object({
		text: z.string(),
		caption: z.string(),
		alignment: z.enum(['left', 'center', 'right']),
	}),
});

export const ImageBlockFileSchema: z.ZodType<ImageBlockFile> = z.object({
	fileId: z.string(),
	fileURL: z.string(),
	url: z.string(),
	width: z.number().optional(),
	height: z.number().optional(),
	size: z.string().optional(),
	name: z.string().optional(),
	title: z.string().optional(),
	extension: z.string().optional(),
});

export const ImageBlockSchema: z.ZodType<ImageBlock> = z.object({
	id: z.string(),
	type: z.literal('image'),
	data: z.object({
		file: ImageBlockFileSchema,
		variants: z.object({
			light: ImageBlockFileSchema.optional(),
		}).optional(),
		caption: z.string(),
		withBorder: z.boolean(),
		withBackground: z.boolean(),
		stretched: z.boolean(),
	}),
});

export const DelimiterBlockSchema: z.ZodType<DelimiterBlock> = z.object({
	id: z.string(),
	type: z.literal('delimiter'),
	data: z.object({}).strict(),
});

// Zod's discriminatedUnion expects ZodObject members; the per-block schemas
// above are annotated as `z.ZodType<XxxBlock>` to enable the lazy
// NestedListItemSchema self-reference, which loses the ZodObject specifics
// that discriminatedUnion needs. We route through `unknown` (the standard
// TS escape hatch when the source/target shapes don't sufficiently overlap)
// — runtime behaviour is unaffected because each cast target IS a ZodObject
// at runtime; only the static type is opaque.
export const BlockEditorBlockSchema = z.discriminatedUnion('type', [
	HeaderBlockSchema as unknown as z.ZodObject<z.ZodRawShape>,
	ParagraphBlockSchema as unknown as z.ZodObject<z.ZodRawShape>,
	NestedListBlockSchema as unknown as z.ZodObject<z.ZodRawShape>,
	CodeBlockSchema as unknown as z.ZodObject<z.ZodRawShape>,
	QuoteBlockSchema as unknown as z.ZodObject<z.ZodRawShape>,
	ImageBlockSchema as unknown as z.ZodObject<z.ZodRawShape>,
	DelimiterBlockSchema as unknown as z.ZodObject<z.ZodRawShape>,
]);

export const BlockEditorDocSchema: z.ZodType<BlockEditorDoc> = z.object({
	time: z.number(),
	blocks: z.array(BlockEditorBlockSchema as unknown as z.ZodType<BlockEditorBlock>),
	version: z.string(),
});

// Localized Block Editor doc — locale map of BlockEditorDocSchema, mirroring
// the LocalizedBlockEditorDoc interface in ./content. Relocated here from
// apps/web/src/lib/schemas/project.ts in slice-28.3 (#82) so apps/cms can
// share the same Zod-4 instance instead of maintaining a local mirror.
// (Type-only import — the content↔blocks type cycle erases at runtime.)
export const LocalizedBlockEditorDocSchema: z.ZodType<LocalizedBlockEditorDoc> = z.object({
	en: BlockEditorDocSchema,
	fr: BlockEditorDocSchema.optional(),
	es: BlockEditorDocSchema.optional(),
});

// ---------------------------------------------------------------------------
// TOC heading helper type — consumed by extractHeadings (Task 13) +
// TableOfContents.svelte (Phase 11 Task 77)
// ---------------------------------------------------------------------------

export interface TocHeading {
	id: string;                // kebab-case slug derived from text (deterministic)
	text: string;              // header text (HTML stripped if marks were embedded)
	level: 1 | 2 | 3 | 4 | 5 | 6;
}
