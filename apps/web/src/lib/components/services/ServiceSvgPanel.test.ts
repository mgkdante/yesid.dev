import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ServiceSvgPanel from './ServiceSvgPanel.svelte';

describe('ServiceSvgPanel', () => {
	it('renders with data-testid', () => {
		render(ServiceSvgPanel, { props: { svgContent: '<svg></svg>' } });
		expect(screen.getByTestId('service-svg-panel')).toBeTruthy();
	});

	it('renders SvgIcon when svgContent is provided', () => {
		render(ServiceSvgPanel, {
			props: { svgContent: '<svg><circle r="10"/></svg>' }
		});
		expect(screen.getByTestId('service-svg-panel').querySelector('[data-slot="svg-icon"]')).toBeTruthy();
	});

	it('renders CornerMarks', () => {
		render(ServiceSvgPanel, { props: { svgContent: '<svg></svg>' } });
		expect(screen.getByTestId('service-svg-panel').querySelector('[data-slot="corner-marks"]')).toBeTruthy();
	});

	it('does not render when svgContent is empty', () => {
		render(ServiceSvgPanel, { props: { svgContent: '' } });
		expect(screen.queryByTestId('service-svg-panel')).toBeNull();
	});

	it('applies variant="banner" class for mobile layout', () => {
		render(ServiceSvgPanel, {
			props: { svgContent: '<svg></svg>', variant: 'banner' }
		});
		const el = screen.getByTestId('service-svg-panel');
		expect(el.classList.contains('svg-panel--banner')).toBe(true);
	});

	// Round 5 regression lock (operator: "you removed the fun svgs!"): the
	// provided SVG markup must actually land in the icon slot — the panel is
	// the services listing/detail art surface.
	it('round 5 — the svg markup itself renders inside the icon slot', () => {
		render(ServiceSvgPanel, {
			props: { svgContent: '<svg data-fun-art><circle r="10"/></svg>' }
		});
		const slot = screen
			.getByTestId('service-svg-panel')
			.querySelector('[data-slot="svg-icon"]');
		expect(slot?.querySelector('svg[data-fun-art] circle')).toBeTruthy();
	});

	// Round 5: hovering anywhere on the panel drives the art morph — the art
	// sits in a pointer-events-none wrapper so the panel owns the hover.
	it('round 5 — the art wrapper is pointer-transparent (panel-wide hover morph)', () => {
		render(ServiceSvgPanel, { props: { svgContent: '<svg></svg>' } });
		const art = screen.getByTestId('service-svg-panel').querySelector('.svg-art');
		expect(art).toBeTruthy();
		expect(art?.classList.contains('pointer-events-none')).toBe(true);
	});
});
