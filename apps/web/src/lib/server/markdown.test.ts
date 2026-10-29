// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { renderGithubReadme } from './markdown';

const RAW_README = 'https://raw.githubusercontent.com/mgkdante/yesid.dev/main/README.md';

async function render(markdown: string): Promise<string> {
	const request = (async () => new Response(markdown, { status: 200 })) as typeof globalThis.fetch;
	const readme = await renderGithubReadme(RAW_README, request);
	expect(readme).toBeDefined();
	return readme!.map((part) => ('html' in part ? part.html : '')).join('');
}

describe('markdown renderer', () => {
	it('splits top-level fences out of the prose and highlights only code', async () => {
		const request = (async () => new Response(['# Title', '', '```ts', 'const x = 1;', '```', '', '```mermaid', 'flowchart LR', '```'].join('\n'))) as typeof globalThis.fetch;
		const readme = await renderGithubReadme(RAW_README, request);
		expect(readme?.map((part) => ('html' in part ? 'html' : part.fence))).toEqual(['html', '```ts\nconst x = 1;\n```', '```mermaid\nflowchart LR\n```']);
		expect(readme?.[1]).toHaveProperty('highlighted', expect.stringContaining('const'));
		expect(readme?.[2]).toHaveProperty('highlighted', undefined);
	});

	it('keeps a fence inside a <details> disclosure', async () => {
		const html = await render(
			['<details><summary>Example</summary>', '', 'before', '', '```sh', 'bun test', '```', '', 'after', '', '</details>'].join('\n'),
		);

		const doc = new DOMParser().parseFromString(html, 'text/html');
		expect(doc.querySelector('details')?.textContent).toContain('bun test');
		expect(doc.querySelector('details')?.textContent).toContain('after');
	});

	it('removes executable README markup and unsafe URL schemes', async () => {
		const html = await render(
			[
				'# Safe heading',
				'<script>globalThis.compromised = true</script>',
				'<img src="data:text/html,unsafe" onerror="globalThis.compromised = true">',
				'<a href="javascript:globalThis.compromised = true" onclick="globalThis.compromised = true">unsafe</a>',
			].join('\n'),
		);

		const doc = new DOMParser().parseFromString(html, 'text/html');
		expect(doc.querySelector('h1')?.textContent).toBe('Safe heading');
		expect(doc.querySelector('script')).toBeNull();
		expect([...doc.querySelectorAll('*')].some((element) => [...element.attributes].some(({ name }) => name.startsWith('on')))).toBe(false);
		expect(doc.querySelector('[href^="javascript:" i], [src^="javascript:" i], [href^="data:text/html" i], [src^="data:text/html" i]')).toBeNull();
	});

	it('discards deeply nested iframe fallback without exhausting the sanitizer stack', async () => {
		const html = await render('<iframe>'.repeat(2500));

		const doc = new DOMParser().parseFromString(html, 'text/html');
		expect(doc.querySelector('iframe')).toBeNull();
	});
});
