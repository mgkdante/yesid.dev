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
