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

	it('removes executable README markup and unsafe URL schemes', async () => {
		const html = await render(
			[
				'# Safe heading',
				'<script>globalThis.compromised = true</script>',
				'<img src="data:text/html,unsafe" onerror="globalThis.compromised = true">',
				'<a href="javascript:globalThis.compromised = true" onclick="globalThis.compromised = true">unsafe</a>',
			].join('\n'),
		);

		expect(html).toContain('<h1>Safe heading</h1>');
		expect(html).not.toMatch(/<script|onerror|onclick|javascript:|data:text\/html/i);
	});

	it('discards deeply nested iframe fallback without exhausting the sanitizer stack', async () => {
		const html = await render('<iframe>'.repeat(2500));

		expect(html).not.toContain('<iframe');
	});
});
