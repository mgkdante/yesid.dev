// Server-side code-highlight collection: CodeBlock renders whatever this map provides.

import { describe, expect, it } from 'vitest';
import type { BlockEditorDoc } from '@repo/shared';
import { collectCodeHighlights } from './code-highlights';

const doc = (blocks: BlockEditorDoc['blocks']): BlockEditorDoc => ({
	time: 1700000000000,
	version: '2.31.2',
	blocks,
});

describe('collectCodeHighlights', () => {
	it('highlights fenced code blocks keyed by block id', async () => {
		const highlights = await collectCodeHighlights([
			doc([
				{ id: 'c-sql', type: 'code', data: { code: '```sql\nSELECT 1;\n```' } },
				{ id: 'p-1', type: 'paragraph', data: { text: 'prose' } },
			]),
		]);
		expect(Object.keys(highlights)).toEqual(['c-sql']);
		expect(highlights['c-sql']).not.toBe('SELECT 1;'); // highlighting ran
		expect(highlights['c-sql']).toContain('SELECT');
	});

	it('skips mermaid fences — MermaidDiagram renders those client-side', async () => {
		const highlights = await collectCodeHighlights([
			doc([{ id: 'm-1', type: 'code', data: { code: 'mermaid\nflowchart LR\n  a --> b' } }]),
		]);
		expect(highlights).toEqual({});
	});

	it('tolerates sparse doc lists (absent optional docs)', async () => {
		expect(await collectCodeHighlights([undefined, null])).toEqual({});
	});
});
