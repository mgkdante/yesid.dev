import { describe, expect, it } from 'vitest';
import { toTextBlocks } from './text-blocks.ts';

describe('toTextBlocks', () => {
	it('keeps plain text as a single paragraph', () => {
		expect(toTextBlocks('Signs this is you: slow queries.')).toEqual([
			{ kind: 'paragraph', text: 'Signs this is you: slow queries.' },
		]);
	});

	it('groups consecutive dash lines into one list and keeps the closing line as a paragraph', () => {
		expect(toTextBlocks('- Slow site\n- Hard to update\r\n\nThat is the gap I close.')).toEqual([
			{ kind: 'list', items: ['Slow site', 'Hard to update'] },
			{ kind: 'paragraph', text: 'That is the gap I close.' },
		]);
	});

	it('does not treat a hyphenated word as a list item', () => {
		expect(toTextBlocks('Copy-paste everywhere')).toEqual([
			{ kind: 'paragraph', text: 'Copy-paste everywhere' },
		]);
	});
});
