import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { WORDMARK_DOT_PATH, WORDMARK_LETTERS_PATH } from './wordmark';

describe('share-card wordmark', () => {
	it('matches the canonical brand file', () => {
		const brand = readFileSync(resolve(__dirname, '../../../../cms/brand/yesid-wordmark.svg'), 'utf8');
		expect(brand).toContain(`<path class="wordmark" d="${WORDMARK_LETTERS_PATH}"`);
		expect(brand).toContain(`<path class="dot" d="${WORDMARK_DOT_PATH}"`);
	});
});
