import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import MetroStation from './MetroStation.svelte';

describe('MetroStation', () => {
	it('renders station badge with index number', () => {
		const { container } = render(MetroStation, { props: { index: 3 } });
		const badge = container.querySelector('[data-slot="metro-station"] [data-slot="badge"]');
		expect(badge).toBeTruthy();
		expect(badge?.textContent?.trim()).toBe('03');
	});

	it('renders pulse animation element', () => {
		const { container } = render(MetroStation, { props: { index: 1 } });
		const pulse = container.querySelector('[data-slot="metro-station-pulse"]');
		expect(pulse).toBeTruthy();
	});

	it('renders SVG line when showLine is true', () => {
		const { container } = render(MetroStation, { props: { index: 1, showLine: true } });
		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();
	});

	// GO2-W5 INTERLOCKING: yellow line that survives daylight + rail ties.
	it('draws the track in line-amber with a border-strong ties overlay', () => {
		const { container } = render(MetroStation, { props: { index: 1, showLine: true } });
		const rail = container.querySelector('[data-metro-line] line');
		expect(rail?.getAttribute('stroke')).toBe('var(--line-amber, var(--primary))');
		const ties = container.querySelector('[data-metro-line-ties]');
		expect(ties?.getAttribute('stroke')).toBe('var(--border-strong)');
		expect(ties?.getAttribute('stroke-dasharray')).toBe('1 4');
	});

	// Round 5: the dotted spine + roundel draw one step bolder.
	it('round 5 — spine draws at 3px and the roundel carries the bolder station class', () => {
		const { container } = render(MetroStation, { props: { index: 1, showLine: true } });
		const svg = container.querySelector('[data-metro-line]');
		expect(svg?.getAttribute('width')).toBe('3');
		expect(svg?.getAttribute('viewBox')).toBe('0 0 3 100');
		const lines = svg ? Array.from(svg.querySelectorAll('line')) : [];
		expect(lines.length).toBe(2);
		for (const line of lines) {
			expect(line.getAttribute('stroke-width')).toBe('3');
		}
		const badge = container.querySelector('[data-slot="badge"]');
		expect(badge?.classList.contains('station-number-badge')).toBe(true);
	});

	// GO2-W5: backlit STM signage roundel — theme-invariant chip.
	it('station number badge carries the signage chip colors', () => {
		const { container } = render(MetroStation, { props: { index: 1 } });
		const badge = container.querySelector('[data-slot="badge"]');
		expect(badge?.getAttribute('style')).toContain('background-color: var(--signage-bg)');
		expect(badge?.getAttribute('style')).toContain('color: var(--signage-text)');
	});

	it('does not render SVG line when showLine is false', () => {
		const { container } = render(MetroStation, { props: { index: 1, showLine: false } });
		const svg = container.querySelector('svg');
		expect(svg).toBeNull();
	});

	it('has data-slot on root', () => {
		const { container } = render(MetroStation, { props: { index: 1 } });
		expect(container.querySelector('[data-slot="metro-station"]')).toBeTruthy();
	});
});
