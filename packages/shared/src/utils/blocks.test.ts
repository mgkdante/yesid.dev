import { describe, it, expect } from 'bun:test';
import {
	kebabSlug,
	stripHtml,
	extractText,
	wordCount,
	readingTime,
	extractHeadings,
	wrapPlainText,
	serializeBlocksToHtml,
} from './blocks';
import { BlockEditorDocSchema } from '../types/blocks';
import type { BlockEditorDoc } from '../types/blocks';

// ---- kebabSlug ----

describe('kebabSlug', () => {
	it('lowercases and joins with hyphens', () => {
		expect(kebabSlug('Why I Left ORM')).toBe('why-i-left-orm');
	});

	it('strips punctuation', () => {
		expect(kebabSlug('Hello, World!')).toBe('hello-world');
	});

	it('collapses multiple whitespace runs into single hyphens', () => {
		expect(kebabSlug('a   b   c')).toBe('a-b-c');
	});

	it('strips leading + trailing hyphens', () => {
		expect(kebabSlug('  hello  ')).toBe('hello');
	});

	it('handles empty input', () => {
		expect(kebabSlug('')).toBe('');
	});

	it('preserves digits', () => {
		expect(kebabSlug('Top 5 Tips')).toBe('top-5-tips');
	});
});

// ---- stripHtml ----

describe('stripHtml', () => {
	it('removes basic tags', () => {
		expect(stripHtml('<b>bold</b>')).toBe('bold');
	});

	it('removes nested tags', () => {
		expect(stripHtml('<a href="x"><b>linked bold</b></a>')).toBe('linked bold');
	});

	it('decodes entities', () => {
		expect(stripHtml('a &lt; b &amp; c &gt; d')).toBe('a < b & c > d');
	});

	it('decodes &quot; and &#39;', () => {
		expect(stripHtml('say &quot;hi&#39;')).toBe('say "hi\'');
	});

	it('decodes &nbsp;', () => {
		expect(stripHtml('a&nbsp;b')).toBe('a b');
	});

	it('handles empty input', () => {
		expect(stripHtml('')).toBe('');
	});

	it('passes through non-HTML', () => {
		expect(stripHtml('plain text')).toBe('plain text');
	});
});

// ---- extractText ----

describe('extractText', () => {
	it('extracts text from a single paragraph', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [{ id: 'a', type: 'paragraph', data: { text: 'Hello world.' } }],
		};
		expect(extractText(doc)).toBe('Hello world.');
	});

	it('strips HTML tags from paragraph text', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{ id: 'a', type: 'paragraph', data: { text: '<b>bold</b> and <i>italic</i>.' } },
			],
		};
		expect(extractText(doc)).toBe('bold and italic.');
	});

	it('joins text across multiple blocks with spaces', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{ id: 'a', type: 'paragraph', data: { text: 'First.' } },
				{ id: 'b', type: 'paragraph', data: { text: 'Second.' } },
			],
		};
		expect(extractText(doc)).toBe('First. Second.');
	});

	it('extracts text from header + paragraph + nestedlist', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{ id: 'a', type: 'header', data: { text: 'Title', level: 2 } },
				{ id: 'b', type: 'paragraph', data: { text: 'Body.' } },
				{
					id: 'c',
					type: 'nestedlist',
					data: {
						style: 'unordered',
						items: [
							{ content: 'one', items: [] },
							{ content: 'two', items: [] },
						],
					},
				},
			],
		};
		expect(extractText(doc)).toBe('Title Body. one two');
	});

	it('extracts text from code blocks (code is plain)', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{ id: 'a', type: 'code', data: { code: 'SELECT 1;' } },
			],
		};
		expect(extractText(doc)).toBe('SELECT 1;');
	});

	it('extracts text from quote (text + caption)', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{
					id: 'a',
					type: 'quote',
					data: { text: 'Quoted.', caption: '— Author', alignment: 'left' },
				},
			],
		};
		expect(extractText(doc)).toBe('Quoted. — Author');
	});

	it('skips delimiters; extracts image caption', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{ id: 'a', type: 'paragraph', data: { text: 'a' } },
				{ id: 'b', type: 'delimiter', data: {} },
				{
					id: 'c',
					type: 'image',
					data: {
						file: { fileId: 'u1', fileURL: '/files/u1', url: '/assets/u1' },
						caption: 'a sample',
						withBorder: false,
						withBackground: false,
						stretched: false,
					},
				},
				{ id: 'd', type: 'paragraph', data: { text: 'b' } },
			],
		};
		expect(extractText(doc)).toBe('a a sample b');
	});

	it('extracts text from deeply nested lists', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{
					id: 'l',
					type: 'nestedlist',
					data: {
						style: 'unordered',
						items: [
							{
								content: 'outer A',
								items: [
									{ content: 'sub 1', items: [] },
									{ content: 'sub 2', items: [] },
								],
							},
							{ content: 'outer B', items: [] },
						],
					},
				},
			],
		};
		expect(extractText(doc)).toBe('outer A sub 1 sub 2 outer B');
	});
});

// ---- wordCount ----

describe('wordCount', () => {
	it('counts words separated by spaces', () => {
		expect(wordCount('hello world')).toBe(2);
	});

	it('returns 0 for empty input', () => {
		expect(wordCount('')).toBe(0);
	});

	it('returns 0 for whitespace-only input', () => {
		expect(wordCount('   \t\n  ')).toBe(0);
	});

	it('treats multiple whitespace as a single separator', () => {
		expect(wordCount('a    b\tc\nd')).toBe(4);
	});

	it("counts punctuation as part of adjacent words (don't / can't)", () => {
		expect(wordCount("don't stop now.")).toBe(3);
	});
});

// ---- readingTime ----

describe('readingTime', () => {
	it('returns 1 minute minimum', () => {
		expect(readingTime(1)).toBe(1);
		expect(readingTime(0)).toBe(1);
	});

	it('returns 1 minute for negative input', () => {
		expect(readingTime(-50)).toBe(1);
	});

	it('uses 200 WPM by default', () => {
		expect(readingTime(200)).toBe(1);
		expect(readingTime(400)).toBe(2);
		expect(readingTime(401)).toBe(3); // ceil
	});

	it('accepts custom WPM', () => {
		expect(readingTime(300, 100)).toBe(3);
	});
});

// ---- extractHeadings ----

describe('extractHeadings', () => {
	it('extracts headings with deterministic ids from text', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{ id: 'a', type: 'header', data: { text: 'First Section', level: 2 } },
				{ id: 'b', type: 'paragraph', data: { text: 'Body.' } },
				{ id: 'c', type: 'header', data: { text: 'Second', level: 3 } },
			],
		};
		expect(extractHeadings(doc)).toEqual([
			{ id: 'first-section', text: 'First Section', level: 2 },
			{ id: 'second', text: 'Second', level: 3 },
		]);
	});

	it('strips inline-mark HTML before slugifying', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{
					id: 'a',
					type: 'header',
					data: { text: 'Why I Left <b>ORM</b>', level: 2 },
				},
			],
		};
		expect(extractHeadings(doc)).toEqual([
			{ id: 'why-i-left-orm', text: 'Why I Left ORM', level: 2 },
		]);
	});

	it('disambiguates duplicate slugs with -2, -3 suffix', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{ id: 'a', type: 'header', data: { text: 'Setup', level: 2 } },
				{ id: 'b', type: 'header', data: { text: 'Setup', level: 2 } },
				{ id: 'c', type: 'header', data: { text: 'Setup', level: 2 } },
			],
		};
		expect(extractHeadings(doc)).toEqual([
			{ id: 'setup', text: 'Setup', level: 2 },
			{ id: 'setup-2', text: 'Setup', level: 2 },
			{ id: 'setup-3', text: 'Setup', level: 2 },
		]);
	});

	it('skips non-heading blocks', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{ id: 'a', type: 'paragraph', data: { text: 'p' } },
				{ id: 'b', type: 'header', data: { text: 'h', level: 2 } },
				{ id: 'c', type: 'delimiter', data: {} },
			],
		};
		expect(extractHeadings(doc)).toEqual([
			{ id: 'h', text: 'h', level: 2 },
		]);
	});

	it('preserves header level (1-6)', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{ id: 'a', type: 'header', data: { text: 'h1', level: 1 } },
				{ id: 'b', type: 'header', data: { text: 'h6', level: 6 } },
			],
		};
		const headings = extractHeadings(doc);
		expect(headings[0].level).toBe(1);
		expect(headings[1].level).toBe(6);
	});
});

// ---- wrapPlainText ----

describe('wrapPlainText', () => {
	it('wraps a single string in a single-paragraph doc', () => {
		const doc = wrapPlainText('Hello.');
		expect(doc.blocks.length).toBe(1);
		expect(doc.blocks[0].type).toBe('paragraph');
		expect((doc.blocks[0] as { data: { text: string } }).data.text).toBe('Hello.');
	});

	it('preserves whitespace within a single paragraph (no normalization)', () => {
		const doc = wrapPlainText('a   b');
		expect((doc.blocks[0] as { data: { text: string } }).data.text).toBe('a   b');
	});

	it('splits on double newlines into multiple paragraphs', () => {
		const doc = wrapPlainText('First.\n\nSecond.');
		expect(doc.blocks.length).toBe(2);
		expect((doc.blocks[0] as { data: { text: string } }).data.text).toBe('First.');
		expect((doc.blocks[1] as { data: { text: string } }).data.text).toBe('Second.');
	});

	it('returns an empty-paragraph doc for empty input', () => {
		const doc = wrapPlainText('');
		expect(doc.blocks.length).toBe(1);
		expect((doc.blocks[0] as { data: { text: string } }).data.text).toBe('');
	});

	it('emits a valid Editor.js doc shape', () => {
		const doc = wrapPlainText('Hello.');
		expect(typeof doc.time).toBe('number');
		expect(doc.version).toBe('2.31.2');
		expect(Array.isArray(doc.blocks)).toBe(true);
	});

	it('parses through BlockEditorDocSchema', () => {
		const doc = wrapPlainText('Hello.\n\nWorld.');
		const result = BlockEditorDocSchema.safeParse(doc);
		expect(result.success).toBe(true);
	});

	it('uses sequential ids p1, p2, ... ', () => {
		const doc = wrapPlainText('a\n\nb\n\nc');
		expect(doc.blocks[0].id).toBe('p1');
		expect(doc.blocks[1].id).toBe('p2');
		expect(doc.blocks[2].id).toBe('p3');
	});
});

// ---- serializeBlocksToHtml ----

describe('serializeBlocksToHtml', () => {
	it('serializes paragraphs to <p> with HTML marks intact', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{ id: 'a', type: 'paragraph', data: { text: '<b>bold</b> and <i>italic</i>.' } },
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe('<p><b>bold</b> and <i>italic</i>.</p>');
	});

	it('serializes headers with deterministic ids', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{ id: 'a', type: 'header', data: { text: 'Section', level: 2 } },
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe('<h2 id="section">Section</h2>');
	});

	it('appends -2 / -3 to duplicate header slugs', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{ id: 'a', type: 'header', data: { text: 'Setup', level: 2 } },
				{ id: 'b', type: 'header', data: { text: 'Setup', level: 2 } },
			],
		};
		const html = serializeBlocksToHtml(doc);
		expect(html).toContain('id="setup"');
		expect(html).toContain('id="setup-2"');
	});

	it('escapes HTML entities in code blocks', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{ id: 'a', type: 'code', data: { code: 'a < b & c > d' } },
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe('<pre><code>a &lt; b &amp; c &gt; d</code></pre>');
	});

	it('serializes quote with caption', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{
					id: 'a',
					type: 'quote',
					data: { text: 'Quoted.', caption: '— Author', alignment: 'left' },
				},
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe(
			'<blockquote><p>Quoted.</p><cite>— Author</cite></blockquote>',
		);
	});

	it('serializes quote without caption', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{
					id: 'a',
					type: 'quote',
					data: { text: 'Quoted.', caption: '', alignment: 'left' },
				},
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe(
			'<blockquote><p>Quoted.</p></blockquote>',
		);
	});

	it('serializes delimiters as <hr>', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [{ id: 'a', type: 'delimiter', data: {} }],
		};
		expect(serializeBlocksToHtml(doc)).toBe('<hr>');
	});

	it('serializes images using file.url + escaped caption', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{
					id: 'a',
					type: 'image',
					data: {
						file: { fileId: 'u1', fileURL: '/files/u1', url: '/assets/u1' },
						caption: 'has "quotes"',
						withBorder: false,
						withBackground: false,
						stretched: false,
					},
				},
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe(
			'<img src="/assets/u1" alt="has &quot;quotes&quot;">',
		);
	});

	it('serializes unordered nestedlist with nested children', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{
					id: 'l',
					type: 'nestedlist',
					data: {
						style: 'unordered',
						items: [
							{
								content: 'outer A',
								items: [{ content: 'inner', items: [] }],
							},
							{ content: 'outer B', items: [] },
						],
					},
				},
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe(
			'<ul><li>outer A<ul><li>inner</li></ul></li><li>outer B</li></ul>',
		);
	});

	it('serializes ordered nestedlist', () => {
		const doc: BlockEditorDoc = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{
					id: 'l',
					type: 'nestedlist',
					data: {
						style: 'ordered',
						items: [
							{ content: 'one', items: [] },
							{ content: 'two', items: [] },
						],
					},
				},
			],
		};
		expect(serializeBlocksToHtml(doc)).toBe(
			'<ol><li>one</li><li>two</li></ol>',
		);
	});
});

// ---- BlockEditorDocSchema parse round-trip (Task 16) ----

describe('BlockEditorDocSchema.parse — full round-trip', () => {
	it('accepts a valid full-shape doc with all 7 block types', () => {
		const doc: unknown = {
			time: 1777164417419,
			version: '2.31.2',
			blocks: [
				{ id: 'a', type: 'header', data: { text: 'h2', level: 2 } },
				{ id: 'b', type: 'paragraph', data: { text: '<b>bold</b>' } },
				{
					id: 'c',
					type: 'nestedlist',
					data: {
						style: 'unordered',
						items: [{ content: 'one', items: [] }],
					},
				},
				{ id: 'd', type: 'code', data: { code: 'SELECT 1;' } },
				{ id: 'e', type: 'quote', data: { text: 'q', caption: '', alignment: 'left' } },
				{
					id: 'f',
					type: 'image',
					data: {
						file: { fileId: 'u1', fileURL: '/files/u1', url: '/assets/u1' },
						caption: '',
						withBorder: false,
						withBackground: false,
						stretched: false,
					},
				},
				{ id: 'g', type: 'delimiter', data: {} },
			],
		};
		const result = BlockEditorDocSchema.safeParse(doc);
		if (!result.success) {
			console.error(result.error.issues);
		}
		expect(result.success).toBe(true);
	});

	it('rejects unknown block types', () => {
		const doc: unknown = {
			time: 1,
			version: '2.31.2',
			blocks: [{ id: 'a', type: 'unknownBlock', data: {} }],
		};
		const result = BlockEditorDocSchema.safeParse(doc);
		expect(result.success).toBe(false);
	});

	it('rejects missing top-level fields', () => {
		const doc: unknown = { blocks: [] };
		const result = BlockEditorDocSchema.safeParse(doc);
		expect(result.success).toBe(false);
	});

	it('rejects invalid header level', () => {
		const doc: unknown = {
			time: 1,
			version: '2.31.2',
			blocks: [{ id: 'a', type: 'header', data: { text: 'x', level: 7 } }],
		};
		const result = BlockEditorDocSchema.safeParse(doc);
		expect(result.success).toBe(false);
	});

	it('accepts deeply nested list items', () => {
		const doc: unknown = {
			time: 1,
			version: '2.31.2',
			blocks: [
				{
					id: 'l',
					type: 'nestedlist',
					data: {
						style: 'unordered',
						items: [
							{
								content: 'a',
								items: [
									{
										content: 'b',
										items: [{ content: 'c', items: [] }],
									},
								],
							},
						],
					},
				},
			],
		};
		const result = BlockEditorDocSchema.safeParse(doc);
		expect(result.success).toBe(true);
	});
});
