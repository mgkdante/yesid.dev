import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import LanguageFlag, { FLAG_IDS, isFlagId } from './LanguageFlag.svelte';

describe('LanguageFlag', () => {
	it.each(FLAG_IDS)('draws the %s flag as a decorative SVG', (id) => {
		const { container } = render(LanguageFlag, { props: { id } });
		const svg = container.querySelector(`svg[data-flag="${id}"]`);
		expect(svg).not.toBeNull();
		expect(svg).toHaveAttribute('aria-hidden', 'true');
		expect(svg!.querySelectorAll('rect').length).toBeGreaterThan(0);
	});

	it('only claims the flags it can draw, so other languages keep their CMS image', () => {
		expect(FLAG_IDS.every(isFlagId)).toBe(true);
		expect(isFlagId('one')).toBe(false);
	});
});
