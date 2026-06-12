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
	it('interpolates {count} in the tech-stack hero terminal templates (operator addendum)', () => {
		expect(fillTemplate('→ loading {count} nodes...', { count: '42' })).toBe('→ loading 42 nodes...');
		expect(fillTemplate('→ {count} technologies cataloged', { count: '42' })).toBe('→ 42 technologies cataloged');
	});
});
