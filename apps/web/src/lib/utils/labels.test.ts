import { describe, expect, it } from 'vitest';
import { fillTemplate } from './labels';

describe('fillTemplate', () => {
	it('substitutes {placeholders} from params', () => {
		expect(fillTemplate('VOL. 01 // ISS. {issue}', { issue: '07' })).toBe('VOL. 01 // ISS. 07');
		expect(fillTemplate('© {year} yesid', { year: '2026' })).toBe('© 2026 yesid');
	});
	it('leaves unknown placeholders intact', () => {
		expect(fillTemplate('{num} / SERVICE', {})).toBe('{num} / SERVICE');
	});
});
