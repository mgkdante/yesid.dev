import { describe, expect, it } from 'vitest';
import { marked } from './markdown';

describe('markdown renderer', () => {
	it('wraps README TypeScript fences in the shared terminal chrome', async () => {
		const html = await marked.parse(['```typescript', 'const x: number = 1;', '```'].join('\n'));

		expect(html).toContain('data-slot="terminal-chrome"');
		expect(html).not.toContain('code-fence-frame');
		expect(html).toContain('data-code-language="ts"');
		expect(html).toContain('terminal-code-copy');
		expect(html).toContain('const');
		expect(html).toContain('x');
	});

	it('uses CSS variables for Shiki colors so README code respects light and dark themes', async () => {
		const html = await marked.parse(['```typescript', 'const x: number = 1;', '```'].join('\n'));

		expect(html).toContain('background-color:var(--terminal)');
		expect(html).toContain('color:var(--terminal-ink)');
		expect(html).toContain('var(--primary)');
		expect(html).not.toContain('#1a1814');
		expect(html).not.toContain('#e8e4de');
		expect(html).not.toContain('#E07800');
	});

	it('wraps README shell fences in the same terminal chrome', async () => {
		const html = await marked.parse(['```bash', 'bun test', '```'].join('\n'));

		expect(html).toContain('data-slot="terminal-chrome"');
		expect(html).not.toContain('code-fence-frame');
		expect(html).toContain('data-code-language="sh"');
		expect(html).toContain('data-code-copy="bun test"');
		expect(html).toContain('terminal-code-copy');
		expect(html).toContain('bun');
		expect(html).toContain('test');
	});

	it('emits Mermaid placeholders instead of highlighting diagrams as code', async () => {
		const html = await marked.parse(['```mermaid', 'flowchart LR', '  a --> b', '```'].join('\n'));

		expect(html).toContain('data-mermaid-source');
		expect(html).toContain('flowchart LR');
		expect(html).not.toContain('class="shiki"');
	});
});
