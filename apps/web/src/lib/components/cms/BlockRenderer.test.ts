import { describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { siteLabels } from '#lib/content/index.ts';
import { resolveLocale } from '#lib/utils/locale.ts';
import BlockRenderer from './BlockRenderer.svelte';
// Server-side highlighter (Shiki) — fine to import in vitest (node context);
// the client bundle guard only applies to app code. Tests build the highlight
// map with the real helper so the load → BlockRenderer → CodeBlock seam is
// exercised end-to-end.
import { collectCodeHighlights } from '#lib/server/code-highlights.ts';
import type { BlockEditorDoc } from '@repo/shared';

// Stub Directus asset helper — PUBLIC_DIRECTUS_URL is unset in the test env
// (setup.dom.ts mocks $app/env/public with an empty media URL), so the real asset()
// throws. Provide a deterministic stub that embeds the UUID in the URL so
// assertions on src can simply use toContain('uuid-123').
vi.mock('#lib/directus/assets.ts', () => ({
	asset: (id: string, _preset?: string) => `/test-assets/${id}`,
	buildSrcSet: () => '',
	assetImage: (id: string, _preset?: string) => ({ src: `/test-assets/${id}` }),
}));

// Use a distinctive editorial title so a hardcoded "code" cannot pass.
vi.mock('#lib/content/index.ts', async (importOriginal) => {
	const content = await importOriginal<typeof import('#lib/content/index.ts')>();
	const labels = structuredClone(content.siteLabels);
	labels.blogChrome.detail.code.title = { en: 'CMS code window' };
	labels.a11y.architectureDiagram = { en: 'CMS architecture label' };
	return { ...content, siteLabels: labels };
});

vi.mock('$app/env', () => ({ browser: true }));

const mermaid = vi.hoisted(() => ({
	initialize: vi.fn(),
	render: vi.fn(async (_id: string, _source: string) => ({ svg: '<svg><text>Diagram</text></svg>' })),
}));
vi.mock('mermaid', () => ({ default: mermaid }));

describe('BlockRenderer.svelte (Editor.js block dispatch)', () => {
	const baseDoc = (blocks: BlockEditorDoc['blocks']): BlockEditorDoc => ({
		time: 1700000000000,
		version: '2.31.2',
		blocks,
	});

	it('loads a trusted YouTube player only after the standalone preview is activated', async () => {
		const doc = baseDoc([{ id: 'video', type: 'paragraph', data: { text: '<a href="https://youtu.be/M7lc1UVf-VE">Package walkthrough</a>' } }]);
		const { container } = render(BlockRenderer, { doc });
		expect(container.querySelector('iframe')).toBeNull();
		expect(container.querySelector('img')).toHaveAttribute('src', 'https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg');
		await fireEvent.click(screen.getByRole('button', { name: 'Play video: Package walkthrough' }));
		const frame = screen.getByTitle('Package walkthrough');
		expect(frame).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?autoplay=1&playsinline=1');
		expect(frame).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
		await fireEvent.load(frame);
		expect(frame).toHaveFocus();
	});

	it('keeps YouTube links embedded in prose as ordinary links', () => {
		const doc = baseDoc([{ id: 'prose', type: 'paragraph', data: { text: 'Watch <a href="https://youtu.be/M7lc1UVf-VE">the example</a> for context.' } }]);
		const { container } = render(BlockRenderer, { doc });
		expect(container.querySelector('[data-testid="youtube-video"]')).toBeNull();
		expect(screen.getByRole('link', { name: 'the example' })).toHaveAttribute('href', 'https://youtu.be/M7lc1UVf-VE');
	});

	it('renders header with deterministic id from stripped text and a real "#" permalink (homework #7c)', () => {
		const doc = baseDoc([
			{ id: 'h1', type: 'header', data: { text: 'Hello World', level: 2 } },
		]);
		const { container } = render(BlockRenderer, { doc });
		const h2 = container.querySelector('h2');
		expect(h2).toBeTruthy();
		expect(h2?.id).toBe('hello-world');
		const anchor = h2?.querySelector('a.heading-anchor');
		expect(anchor?.getAttribute('href')).toBe('#hello-world');
		expect(anchor?.getAttribute('aria-labelledby')).toBe('hello-world');
		expect(h2?.textContent).toBe('Hello World#');
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

	it('renders markdown-style inline code spans in paragraph text', () => {
		const doc = baseDoc([
			{
				id: 'p1',
				type: 'paragraph',
				data: { text: 'Run `bun test` after <b>green</b>.' },
			},
		]);
		const { container } = render(BlockRenderer, { doc });
		expect(container.querySelector('b')?.textContent).toBe('green');
		expect(container.querySelector('p code')?.textContent).toBe('bun test');
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

	it('renders code block (no language attribute per AM3)', async () => {
		const doc = baseDoc([
			{ id: 'c1', type: 'code', data: { code: 'SELECT 1;' } },
		]);
		const { container } = render(BlockRenderer, { doc, codeHighlights: await collectCodeHighlights([doc]) });
		expect(container.textContent).toContain('SELECT 1;');
	});

	it('renders a plain escaped <pre> when no server highlight is provided', () => {
		// Surfaces whose load does not call collectCodeHighlights fall back to
		// unhighlighted-but-styled output — never client-side Shiki.
		const doc = baseDoc([
			{ id: 'c-plain', type: 'code', data: { code: '```ts\nconst a = 1 < 2;\n```' } },
		]);
		render(BlockRenderer, { doc });
		expect(screen.getByText('const a = 1 < 2;')).toBeInTheDocument();
		expect(screen.getByText('ts')).toBeInTheDocument();
	});

	it('renders fenced script code blocks with language badge and copies the script body', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText },
			configurable: true,
		});
		const script = [
			'```sh',
			'export OP_SERVICE_ACCOUNT_TOKEN="$(grep ^OP_TOKEN= .env | cut -d= -f2-)"',
			'op run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev bun apps/cms/scripts/export-fallbacks.ts --module=projects',
			'```',
		].join('\n');
		const doc = baseDoc([
			{ id: 'c-script', type: 'code', data: { code: script } },
		]);
		const { container } = render(BlockRenderer, { doc, codeHighlights: await collectCodeHighlights([doc]) });
		const button = screen.getByRole('button', { name: resolveLocale(siteLabels.blogChrome.detail.code.copyAria, 'en') });

		expect(screen.getByText('sh')).toBeInTheDocument();
		expect(container.textContent).toContain('op run --env-file=apps/cms/.env');
		expect(container.textContent).not.toContain('```');
		expect(button).toBeTruthy();

		await fireEvent.click(button);

		expect(writeText).toHaveBeenCalledWith(
			[
				'export OP_SERVICE_ACCOUNT_TOKEN="$(grep ^OP_TOKEN= .env | cut -d= -f2-)"',
				'op run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev bun apps/cms/scripts/export-fallbacks.ts --module=projects',
			].join('\n'),
		);
	});

	it('renders TypeScript code fences with the shared code frame', async () => {
		const doc = baseDoc([
			{
				id: 'c-ts',
				type: 'code',
				data: {
					code: [
						'```typescript',
						'export const projects = [...] satisfies Project[];',
						'```',
					].join('\n'),
				},
			},
		]);
		const { container } = render(BlockRenderer, { doc, codeHighlights: await collectCodeHighlights([doc]) });

		expect(screen.getByText('ts')).toBeInTheDocument();
		expect(container.textContent).toContain(
			'export const projects = [...] satisfies Project[];',
		);
	});

	it('renders mermaid code blocks as CMS-authored diagrams', async () => {
		const doc = baseDoc([
			{
				id: 'm1',
				type: 'code',
				data: {
					code: 'mermaid\nflowchart LR\n  directus["Directus CMS"] --> cache["generated TypeScript cache"]',
				},
			},
		]);
		const { container } = render(BlockRenderer, { doc });
		const diagram = container.querySelector('[data-testid="mermaid-diagram"]');

		expect(diagram).toBeTruthy();
		expect(diagram?.textContent).toContain('Directus CMS');
		expect(diagram?.textContent).toContain('generated TypeScript cache');
		expect(container.querySelector('.copy-btn')).toBeNull();
		await waitFor(() => expect(diagram?.querySelector('svg')).toBeInTheDocument());
	});

	it('re-renders Mermaid with the active palette when the document theme changes', async () => {
		const previousTheme = document.documentElement.getAttribute('data-theme');
		// happy-dom caches descendant styles across ancestor attribute changes.
		// Supply computed CSS at the browser boundary; use the real theme builder.
		const computedStyle = vi.spyOn(globalThis, 'getComputedStyle').mockImplementation(() => {
			const style = document.createElement('div').style;
			const dark = document.documentElement.dataset.theme === 'dark';
			style.setProperty('--primary', dark ? '#ee8800' : '#884400');
			style.setProperty('--accent', dark ? '#ffcc44' : '#775500');
			return style;
		});
		document.documentElement.dataset.theme = 'dark';
		mermaid.initialize.mockClear();
		mermaid.render.mockClear();
		const source = 'flowchart LR\n  cms --> cache';
		try {
			const { container, unmount } = render(BlockRenderer, {
				doc: baseDoc([{ id: 'theme-diagram', type: 'code', data: { code: 'mermaid\n' + source } }]),
			});
			await waitFor(() => expect(mermaid.render).toHaveBeenCalledTimes(1));
			expect(mermaid.initialize).toHaveBeenLastCalledWith(expect.objectContaining({
				themeVariables: expect.objectContaining({ primaryBorderColor: '#ee8800', lineColor: '#ffcc44' }),
			}));
			expect(mermaid.render).toHaveBeenLastCalledWith(expect.any(String), source);
			await waitFor(() => expect(container.querySelector('svg')?.textContent).toBe('Diagram'));
			expect(container.querySelector('[aria-label]')).toHaveAttribute(
				'aria-label', siteLabels.a11y.architectureDiagram.en,
			);

			let finishRender!: (result: { svg: string }) => void;
			mermaid.render.mockImplementationOnce(() => new Promise((resolve) => { finishRender = resolve; }));
			document.documentElement.dataset.theme = 'light';
			await waitFor(() => expect(mermaid.render).toHaveBeenCalledTimes(2));
			expect(mermaid.initialize).toHaveBeenLastCalledWith(expect.objectContaining({
				themeVariables: expect.objectContaining({ primaryBorderColor: '#884400', lineColor: '#775500' }),
			}));
			expect(mermaid.render).toHaveBeenLastCalledWith(expect.any(String), source);
			// Keep the existing drawing visible while its replacement is rendering.
			expect(container.querySelector('svg')?.textContent).toBe('Diagram');
			finishRender({ svg: '<svg><text>Light diagram</text></svg>' });
			await waitFor(() => expect(container.querySelector('svg')?.textContent).toBe('Light diagram'));
			await unmount();
		} finally {
			cleanup();
			computedStyle.mockRestore();
			if (previousTheme === null) document.documentElement.removeAttribute('data-theme');
			else document.documentElement.setAttribute('data-theme', previousTheme);
		}
	});

	it('renders the CMS code chrome title', () => {
		render(BlockRenderer, {
			doc: baseDoc([{ id: 'chrome-title', type: 'code', data: { code: 'SELECT 1;' } }]),
		});
		expect(screen.getByText('CMS code window')).toBeInTheDocument();
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
