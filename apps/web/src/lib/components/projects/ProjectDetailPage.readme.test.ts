import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { projectFactory } from '../../../tests/factories';
import ProjectDetailPage from './ProjectDetailPage.svelte';

const mermaidMock = vi.hoisted(() => ({
	initialize: vi.fn(),
	render: vi.fn().mockResolvedValue({ svg: '<svg data-testid="rendered-readme-mermaid"></svg>' }),
}));

vi.mock('mermaid', () => ({ default: mermaidMock }));
vi.mock('$lib/directus/assets', () => ({
	asset: (id: string) => `/test-assets/${id}`,
	buildSrcSet: () => '',
	assetImage: (id: string) => ({ src: `/test-assets/${id}` }),
}));

afterEach(() => {
	cleanup();
	Reflect.deleteProperty(navigator, 'clipboard');
	mermaidMock.initialize.mockClear();
	mermaidMock.render.mockClear();
	vi.restoreAllMocks();
});

describe('ProjectDetailPage README behavior', () => {
	it('keeps sanitized headings, terminal copy controls, and Mermaid attributes functional', async () => {
		const clipboardWrite = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: { writeText: clipboardWrite },
		});
		const readmeHtml = [
			'<h2>README heading</h2>',
			'<figure class="terminal terminal-code" data-slot="terminal-chrome" data-code-language="sh" data-code-copy="bun test">',
			'<figcaption class="terminal-titlebar"><button type="button" class="terminal-code-copy" data-code-copy-button aria-label="Copy code">Copy</button></figcaption>',
			'<div class="terminal-body no-pad terminal-code-body"><pre><code>bun test</code></pre></div>',
			'</figure>',
			'<figure class="mermaid-diagram" data-testid="mermaid-diagram" data-mermaid-source="flowchart LR&#10;  a --&gt; b">',
			'<div class="mermaid-diagram__surface"><pre class="mermaid-diagram__fallback"><code>flowchart LR</code></pre></div>',
			'</figure>',
		].join('');
		const project = projectFactory.build({
			slug: 'readme-project',
			sections: [],
			relatedServices: [],
		});

		const { container } = render(ProjectDetailPage, {
			props: { project, services: [], serviceSvgContents: {}, readmeHtml },
		});

		const heading = container.querySelector<HTMLHeadingElement>('h2#readme-h-0');
		expect(heading).toHaveTextContent('README heading');
		expect(heading?.querySelector('.heading-anchor')).toHaveAttribute('href', '#readme-h-0');
		const terminal = container.querySelector<HTMLElement>('[data-slot="terminal-chrome"]');
		expect(terminal).toHaveAttribute('data-code-language', 'sh');
		expect(terminal).toHaveAttribute('data-code-copy', 'bun test');
		const copyButton = container.querySelector<HTMLButtonElement>('[data-code-copy-button]');
		expect(copyButton).toBeTruthy();
		await tick();
		await tick();
		await fireEvent.click(copyButton!);
		await vi.waitFor(() => expect(clipboardWrite).toHaveBeenCalledWith('bun test'));
		await vi.waitFor(() => expect(copyButton).toHaveTextContent('✓'));

		const diagram = screen.getByTestId('mermaid-diagram');
		expect(diagram).toHaveAttribute('data-mermaid-source', 'flowchart LR\n  a --> b');
		await vi.waitFor(() => expect(mermaidMock.render).toHaveBeenCalledOnce());
		expect(mermaidMock.initialize).toHaveBeenCalledWith(
			expect.objectContaining({ securityLevel: 'strict', theme: 'base' }),
		);
		await vi.waitFor(() =>
			expect(screen.getByTestId('rendered-readme-mermaid')).toBeInTheDocument(),
		);
	});
});
