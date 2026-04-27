import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import BlockRenderer from './BlockRenderer.svelte';
import type { BlockEditorDoc } from '@repo/shared';

// Stub Directus asset helper — PUBLIC_DIRECTUS_URL is unset in the test env
// (setup.dom.ts mocks $env/dynamic/public as { env: {} }), so the real asset()
// throws. Provide a deterministic stub that embeds the UUID in the URL so
// assertions on src can simply use toContain('uuid-123').
vi.mock('$lib/directus/assets', () => ({
	asset: (id: string, _preset?: string) => `/test-assets/${id}`,
	buildSrcSet: () => '',
}));

describe('BlockRenderer.svelte (Editor.js block dispatch)', () => {
	const baseDoc = (blocks: BlockEditorDoc['blocks']): BlockEditorDoc => ({
		time: 1700000000000,
		version: '2.31.2',
		blocks,
	});

	it('renders header with deterministic id from stripped text', () => {
		const doc = baseDoc([
			{ id: 'h1', type: 'header', data: { text: 'Hello World', level: 2 } },
		]);
		const { container } = render(BlockRenderer, { doc });
		const h2 = container.querySelector('h2');
		expect(h2).toBeTruthy();
		expect(h2?.id).toBe('hello-world');
		expect(h2?.textContent).toBe('Hello World');
	});

	it('renders paragraph with raw HTML inline marks (AM2)', () => {
		const doc = baseDoc([
			{
				id: 'p1',
				type: 'paragraph',
				data: { text: 'a <b>bold</b> <i>em</i> <a href="https://yesid.dev">link</a>' },
			},
		]);
		const { container } = render(BlockRenderer, { doc });
		expect(container.querySelector('b')?.textContent).toBe('bold');
		expect(container.querySelector('i')?.textContent).toBe('em');
		expect(container.querySelector('a')?.getAttribute('href')).toBe('https://yesid.dev');
	});

	it('renders unordered nestedlist', () => {
		const doc = baseDoc([
			{
				id: 'nl1',
				type: 'nestedlist',
				data: {
					style: 'unordered',
					items: [
						{ content: 'one', items: [] },
						{ content: 'two', items: [] },
					],
				},
			},
		]);
		const { container } = render(BlockRenderer, { doc });
		const items = container.querySelectorAll('ul > li');
		expect(items.length).toBe(2);
		expect(items[0]?.textContent?.trim()).toBe('one');
	});

	it('renders ordered nestedlist', () => {
		const doc = baseDoc([
			{
				id: 'nl2',
				type: 'nestedlist',
				data: {
					style: 'ordered',
					items: [{ content: 'step', items: [] }],
				},
			},
		]);
		const { container } = render(BlockRenderer, { doc });
		expect(container.querySelector('ol > li')).toBeTruthy();
	});

	it('renders nested list (recursion)', () => {
		const doc = baseDoc([
			{
				id: 'nl3',
				type: 'nestedlist',
				data: {
					style: 'unordered',
					items: [
						{
							content: 'outer',
							items: [{ content: 'inner', items: [] }],
						},
					],
				},
			},
		]);
		const { container } = render(BlockRenderer, { doc });
		expect(container.querySelector('ul > li > ul > li')).toBeTruthy();
	});

	it('renders code block (no language attribute per AM3)', () => {
		const doc = baseDoc([
			{ id: 'c1', type: 'code', data: { code: 'SELECT 1;' } },
		]);
		const { container } = render(BlockRenderer, { doc });
		const code = container.querySelector('pre code');
		expect(code?.textContent).toBe('SELECT 1;');
		expect(code?.className).toBe('');
	});

	it('escapes plain text in code block (XSS attempt)', () => {
		const doc = baseDoc([
			{ id: 'c2', type: 'code', data: { code: '<script>alert(1)</script>' } },
		]);
		const { container } = render(BlockRenderer, { doc });
		const code = container.querySelector('pre code');
		expect(code?.textContent).toBe('<script>alert(1)</script>');
		expect(container.querySelectorAll('script')).toHaveLength(0);
	});

	it('renders quote with text + caption', () => {
		const doc = baseDoc([
			{
				id: 'q1',
				type: 'quote',
				data: { text: 'Be the change.', caption: 'Gandhi', alignment: 'center' },
			},
		]);
		const { container } = render(BlockRenderer, { doc });
		const bq = container.querySelector('blockquote');
		expect(bq?.textContent).toContain('Be the change.');
		expect(container.querySelector('cite')?.textContent).toBe('Gandhi');
	});

	it('renders delimiter (HR)', () => {
		const doc = baseDoc([
			{ id: 'd1', type: 'delimiter', data: {} },
		]);
		const { container } = render(BlockRenderer, { doc });
		expect(container.querySelector('hr')).toBeTruthy();
	});

	it('renders image with alt + asset URL', () => {
		const doc = baseDoc([
			{
				id: 'img1',
				type: 'image',
				data: {
					file: { fileId: 'uuid-123', fileURL: '/files/uuid-123', url: '/assets/uuid-123' },
					caption: 'A picture',
					withBorder: false,
					withBackground: false,
					stretched: false,
				},
			},
		]);
		const { container } = render(BlockRenderer, { doc });
		const img = container.querySelector('img');
		expect(img?.getAttribute('alt')).toBe('A picture');
		expect(img?.getAttribute('src')).toContain('uuid-123');
	});

	it('handles multi-paragraph quote as N consecutive blocks (AM5)', () => {
		const doc = baseDoc([
			{ id: 'q2', type: 'quote', data: { text: 'First.', caption: '', alignment: 'left' } },
			{ id: 'q3', type: 'quote', data: { text: 'Second.', caption: '', alignment: 'left' } },
		]);
		const { container } = render(BlockRenderer, { doc });
		const quotes = container.querySelectorAll('blockquote');
		expect(quotes.length).toBe(2);
	});

	it('handles empty doc gracefully', () => {
		const doc = baseDoc([]);
		const { container } = render(BlockRenderer, { doc });
		expect(container.children.length).toBe(0);
	});

	it('skips unknown block types silently', () => {
		const doc = baseDoc([
			{ id: 'u1', type: 'unknown' as never, data: {} as never },
			{ id: 'p2', type: 'paragraph', data: { text: 'after unknown' } },
		]);
		const { container } = render(BlockRenderer, { doc });
		expect(container.querySelector('p')?.textContent).toBe('after unknown');
	});
});
