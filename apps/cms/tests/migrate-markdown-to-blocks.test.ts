import { describe, it, expect } from 'bun:test';
import { resolve, join } from 'node:path';
import { readFileSync } from 'node:fs';
import {
	parseFrontmatter,
	mapMarkdownToBlocks,
	stripLeadingTitleHeading,
	inlineToHtml,
	resetIdCounter,
} from '../scripts/migrate-markdown-to-blocks';
import { BlockEditorDocSchema } from '@repo/shared';
import { marked } from 'marked';

// ---- parseFrontmatter ----

describe('parseFrontmatter', () => {
	it('parses key: value pairs', () => {
		const raw = '---\ntitle: Hello\nlang: en\n---\nBody.';
		const { data, content } = parseFrontmatter(raw);
		expect(data.title).toBe('Hello');
		expect(data.lang).toBe('en');
		expect(content.trim()).toBe('Body.');
	});

	it('parses array values [a, b, c]', () => {
		const raw = '---\ntags: [sql, postgres]\n---\nBody.';
		const { data } = parseFrontmatter(raw);
		expect(data.tags).toEqual(['sql', 'postgres']);
	});

	it('parses booleans', () => {
		const raw = '---\nexternal: true\n---\nBody.';
		const { data } = parseFrontmatter(raw);
		expect(data.external).toBe(true);
	});

	it('returns empty data when no frontmatter delimiter', () => {
		const { data, content } = parseFrontmatter('Just body.');
		expect(data).toEqual({});
		expect(content).toBe('Just body.');
	});
});

// ---- inlineToHtml ----

describe('inlineToHtml — Editor.js raw-HTML inline marks (AM2)', () => {
	function paraTokens(md: string): unknown[] {
		const tokens = marked.lexer(md);
		return (tokens[0] as { tokens: unknown[] }).tokens;
	}

	it('plain text passes through (escaped)', () => {
		expect(inlineToHtml(paraTokens('Hello world.') as never)).toBe('Hello world.');
	});

	it('escapes < > & in text', () => {
		expect(inlineToHtml(paraTokens('a < b & c > d') as never)).toBe('a &lt; b &amp; c &gt; d');
	});

	it('bold → <b>', () => {
		expect(inlineToHtml(paraTokens('**bold**') as never)).toBe('<b>bold</b>');
	});

	it('italic → <i>', () => {
		expect(inlineToHtml(paraTokens('*italic*') as never)).toBe('<i>italic</i>');
	});

	it('inline code → <code>', () => {
		expect(inlineToHtml(paraTokens('`x`') as never)).toBe('<code>x</code>');
	});

	it('link → <a href>', () => {
		expect(inlineToHtml(paraTokens('[label](https://x.dev)') as never)).toBe(
			'<a href="https://x.dev">label</a>',
		);
	});

	it('strike → <s>', () => {
		expect(inlineToHtml(paraTokens('~~gone~~') as never)).toBe('<s>gone</s>');
	});

	it('combines multiple marks in order', () => {
		expect(inlineToHtml(paraTokens('a **b** *c* `d` [e](https://x)') as never)).toBe(
			'a <b>b</b> <i>c</i> <code>d</code> <a href="https://x">e</a>',
		);
	});
});

// ---- mapMarkdownToBlocks: heading ----

describe('mapMarkdownToBlocks — heading (AM1)', () => {
	it('emits header block at depth 1', () => {
		resetIdCounter();
		const doc = mapMarkdownToBlocks('# Hello');
		expect(doc.blocks[0]).toMatchObject({
			type: 'header',
			data: { text: 'Hello', level: 1 },
		});
	});

	it('preserves levels 1–6', () => {
		const doc = mapMarkdownToBlocks('## L2\n\n### L3\n\n#### L4\n\n##### L5\n\n###### L6');
		expect((doc.blocks[0] as { data: { level: number } }).data.level).toBe(2);
		expect((doc.blocks[1] as { data: { level: number } }).data.level).toBe(3);
		expect((doc.blocks[2] as { data: { level: number } }).data.level).toBe(4);
		expect((doc.blocks[3] as { data: { level: number } }).data.level).toBe(5);
		expect((doc.blocks[4] as { data: { level: number } }).data.level).toBe(6);
	});

	it('inline marks render as HTML in heading text', () => {
		const doc = mapMarkdownToBlocks('# Hello *italic*');
		expect((doc.blocks[0] as { data: { text: string } }).data.text).toBe('Hello <i>italic</i>');
	});
});

// ---- mapMarkdownToBlocks: paragraph ----

describe('mapMarkdownToBlocks — paragraph (AM2)', () => {
	it('emits paragraph block', () => {
		const doc = mapMarkdownToBlocks('Hello world.');
		expect(doc.blocks[0]).toMatchObject({
			type: 'paragraph',
			data: { text: 'Hello world.' },
		});
	});

	it('paragraph with inline marks → HTML in data.text', () => {
		const doc = mapMarkdownToBlocks('a **b** *c* `d` [e](https://x)');
		expect((doc.blocks[0] as { data: { text: string } }).data.text).toBe(
			'a <b>b</b> <i>c</i> <code>d</code> <a href="https://x">e</a>',
		);
	});
});

// ---- mapMarkdownToBlocks: lists ----

describe('mapMarkdownToBlocks — lists (AM1 nestedlist)', () => {
	it('unordered list → nestedlist style: unordered', () => {
		const doc = mapMarkdownToBlocks('- one\n- two\n- three');
		const list = doc.blocks[0] as { type: string; data: { style: string; items: { content: string }[] } };
		expect(list.type).toBe('nestedlist');
		expect(list.data.style).toBe('unordered');
		expect(list.data.items.length).toBe(3);
		expect(list.data.items[0].content).toBe('one');
	});

	it('ordered list → nestedlist style: ordered', () => {
		const doc = mapMarkdownToBlocks('1. step one\n2. step two');
		const list = doc.blocks[0] as { data: { style: string; items: unknown[] } };
		expect(list.data.style).toBe('ordered');
		expect(list.data.items.length).toBe(2);
	});

	it('list items contain inline-mark HTML', () => {
		const doc = mapMarkdownToBlocks('- **bold** text');
		const item = (doc.blocks[0] as { data: { items: { content: string }[] } }).data.items[0];
		expect(item.content).toContain('<b>bold</b>');
	});

	it('nested ordered inside unordered → recursive items[].items', () => {
		const md = '- outer A\n  1. sub 1\n  2. sub 2\n- outer B';
		const doc = mapMarkdownToBlocks(md);
		const list = doc.blocks[0] as { data: { style: string; items: { content: string; items: { content: string }[] }[] } };
		expect(list.data.style).toBe('unordered');
		const firstItem = list.data.items[0];
		expect(firstItem.items.length).toBe(2);
		expect(firstItem.items[0].content).toBe('sub 1');
	});

	it('leaf items have items: []', () => {
		const doc = mapMarkdownToBlocks('- one\n- two');
		const list = doc.blocks[0] as { data: { items: { items: unknown[] }[] } };
		expect(list.data.items[0].items).toEqual([]);
	});
});

// ---- mapMarkdownToBlocks: code (AM3 — no language) ----

describe('mapMarkdownToBlocks — code (AM3)', () => {
	it('fenced code → code block with raw text, NO language attr', () => {
		const doc = mapMarkdownToBlocks('```sql\nSELECT 1;\n```');
		const block = doc.blocks[0] as { type: string; data: Record<string, unknown> };
		expect(block.type).toBe('code');
		expect(block.data).toEqual({ code: 'SELECT 1;' });
		// AM3: language hint is dropped
		expect(block.data.language).toBeUndefined();
	});

	it('fenced code without language hint', () => {
		const doc = mapMarkdownToBlocks('```\nplain code\n```');
		expect(doc.blocks[0]).toMatchObject({ type: 'code', data: { code: 'plain code' } });
	});

	it('multi-line code preserved verbatim', () => {
		const doc = mapMarkdownToBlocks('```ts\nconst x = 1;\nconst y = 2;\n```');
		expect((doc.blocks[0] as { data: { code: string } }).data.code).toBe('const x = 1;\nconst y = 2;');
	});

	it('special chars preserved (no HTML escape inside code)', () => {
		const doc = mapMarkdownToBlocks('```\na < b & c > d\n```');
		expect((doc.blocks[0] as { data: { code: string } }).data.code).toBe('a < b & c > d');
	});
});

// ---- mapMarkdownToBlocks: blockquote (AM5 — multi-para → N quote blocks) ----

describe('mapMarkdownToBlocks — blockquote (AM5)', () => {
	it('single-paragraph blockquote → 1 quote block', () => {
		const doc = mapMarkdownToBlocks('> Quoted.');
		expect(doc.blocks[0]).toMatchObject({
			type: 'quote',
			data: { text: 'Quoted.', caption: '', alignment: 'left' },
		});
	});

	it('multi-paragraph blockquote → N consecutive quote blocks', () => {
		const doc = mapMarkdownToBlocks('> First.\n>\n> Second.');
		expect(doc.blocks.length).toBe(2);
		expect(doc.blocks[0]).toMatchObject({ type: 'quote', data: { text: 'First.' } });
		expect(doc.blocks[1]).toMatchObject({ type: 'quote', data: { text: 'Second.' } });
	});

	it('blockquote inline marks render as HTML', () => {
		const doc = mapMarkdownToBlocks('> **bold** word');
		expect((doc.blocks[0] as { data: { text: string } }).data.text).toBe('<b>bold</b> word');
	});
});

// ---- mapMarkdownToBlocks: hr (AM6 — delimiter) ----

describe('mapMarkdownToBlocks — horizontal rule (AM6)', () => {
	it('--- → delimiter block', () => {
		const doc = mapMarkdownToBlocks('---');
		expect(doc.blocks[0]).toMatchObject({ type: 'delimiter', data: {} });
	});
});

// ---- mapMarkdownToBlocks: image ----

describe('mapMarkdownToBlocks — image', () => {
	it('![alt](path) → image block with file metadata via assetIdFor', () => {
		const fakeMap = (path: string): string | undefined =>
			path === 'images/blog/screenshot.png' ? 'uuid-1234' : undefined;
		const doc = mapMarkdownToBlocks('![Screenshot](images/blog/screenshot.png)', { assetIdFor: fakeMap });
		const block = doc.blocks[0] as {
			type: string;
			data: { file: { fileId: string; url: string }; caption: string; withBorder: boolean };
		};
		expect(block.type).toBe('image');
		expect(block.data.file.fileId).toBe('uuid-1234');
		expect(block.data.file.url).toBe('/assets/uuid-1234');
		expect(block.data.caption).toBe('Screenshot');
		expect(block.data.withBorder).toBe(false);
	});

	it('throws when assetIdFor not provided + image present', () => {
		expect(() => mapMarkdownToBlocks('![A](path)')).toThrow(/assetIdFor/);
	});

	it('throws when assetIdFor returns undefined', () => {
		const fakeMap = (): undefined => undefined;
		expect(() => mapMarkdownToBlocks('![A](unknown)', { assetIdFor: fakeMap })).toThrow(
			/asset not found/i,
		);
	});
});

// ---- stripLeadingTitleHeading ----

describe('stripLeadingTitleHeading', () => {
	it('drops leading # when matches frontmatter title (case-insensitive trim)', () => {
		const doc = mapMarkdownToBlocks('# Hello\n\nBody.', { stripLeadingTitle: 'hello' });
		expect(doc.blocks.length).toBe(1);
		expect(doc.blocks[0].type).toBe('paragraph');
	});

	it('keeps leading # when does NOT match', () => {
		const doc = mapMarkdownToBlocks('# Different\n\nBody.', { stripLeadingTitle: 'Hello' });
		expect(doc.blocks.length).toBe(2);
		expect(doc.blocks[0].type).toBe('header');
	});

	it('keeps depth-2 leading heading even if matches', () => {
		const doc = mapMarkdownToBlocks('## Hello\n\nBody.', { stripLeadingTitle: 'Hello' });
		expect(doc.blocks.length).toBe(2);
	});
});

// ---- BlockEditorDocSchema validation ----

describe('mapMarkdownToBlocks — output validates against BlockEditorDocSchema', () => {
	it('full sample doc parses cleanly', () => {
		const md = `# Title

Paragraph with **bold** and *italic*.

## Section

- one
- two

\`\`\`ts
const x = 1;
\`\`\`

> Quote.

---`;
		const doc = mapMarkdownToBlocks(md);
		const result = BlockEditorDocSchema.safeParse(doc);
		if (!result.success) {
			console.error(result.error.issues);
		}
		expect(result.success).toBe(true);
	});
});

// ---- Real-content round-trip on all 7 blog posts ----

describe('mapMarkdownToBlocks — real-content round-trip (all 7 posts)', () => {
	const blogRoot = resolve(__dirname, '..', '..', 'web', 'src', 'content', 'blog');
	const posts = [
		'professional/why-i-left-orm-for-raw-sql',
		'professional/anime-data-viz-challenge',
		'professional/building-a-transit-pipeline',
		'professional/lorem-data-warehousing',
		'professional/lorem-etl-patterns',
		'personal/lorem-space-exploration',
		'personal/lorem-transit-future',
	] as const;

	for (const slugPath of posts) {
		it(`migrates ${slugPath} cleanly`, () => {
			const filepath = join(blogRoot, slugPath, 'index.md');
			const raw = readFileSync(filepath, 'utf-8');
			const { data, content } = parseFrontmatter(raw);
			const doc = mapMarkdownToBlocks(content, {
				stripLeadingTitle: data.title,
				assetIdFor: () => undefined, // none of the 7 posts have inline images
			});
			const validated = BlockEditorDocSchema.safeParse(doc);
			if (!validated.success) {
				console.error(slugPath, validated.error.issues);
			}
			expect(validated.success).toBe(true);
			expect(doc.blocks.length).toBeGreaterThan(0);
		});
	}
});
