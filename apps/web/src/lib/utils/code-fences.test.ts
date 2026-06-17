import { describe, expect, it } from 'vitest';
import { normalizeCodeLanguage, parseCodeFence } from './code-fences';

describe('code fence parsing', () => {
	it('normalizes fenced TypeScript code while preserving the raw language', () => {
		const parsed = parseCodeFence('```typescript\nconst x: number = 1;\n```');

		expect(parsed).toMatchObject({
			kind: 'code',
			body: 'const x: number = 1;',
			language: 'typescript',
			normalizedLanguage: 'ts',
			title: 'ts',
		});
	});

	it('normalizes shell aliases to sh', () => {
		expect(normalizeCodeLanguage('bash')).toBe('sh');
		expect(normalizeCodeLanguage('shell')).toBe('sh');
		expect(normalizeCodeLanguage('zsh')).toBe('sh');
	});

	it('parses prefixed Mermaid blocks as diagrams', () => {
		const parsed = parseCodeFence('mermaid\nflowchart LR\n  a --> b');

		expect(parsed).toMatchObject({
			kind: 'mermaid',
			body: 'flowchart LR\n  a --> b',
			language: 'mermaid',
			normalizedLanguage: 'mermaid',
			title: 'mermaid',
		});
	});

	it('parses fenced Mermaid blocks as diagrams', () => {
		const parsed = parseCodeFence('```mermaid\nflowchart LR\n  a --> b\n```');

		expect(parsed).toMatchObject({
			kind: 'mermaid',
			body: 'flowchart LR\n  a --> b',
			language: 'mermaid',
			normalizedLanguage: 'mermaid',
			title: 'mermaid',
		});
	});

	it('treats unfenced code as plain text without trimming the body', () => {
		const code = 'SELECT 1;\n';
		const parsed = parseCodeFence(code);

		expect(parsed).toMatchObject({
			kind: 'code',
			body: code,
			language: null,
			normalizedLanguage: 'text',
			title: 'text',
		});
	});
});
