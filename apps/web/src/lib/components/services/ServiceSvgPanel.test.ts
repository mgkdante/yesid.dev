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

	it('round 5 — the svg markup itself renders inside the icon slot', () => {
		render(ServiceSvgPanel, {
			props: { svgContent: '<svg data-fun-art><circle r="10"/></svg>' }
		});
		const slot = screen
			.getByTestId('service-svg-panel')
			.querySelector('[data-slot="svg-icon"]');
		expect(slot?.querySelector('svg[data-fun-art] circle')).toBeTruthy();
	});

	it('round 5 — the art wrapper is pointer-transparent (panel-wide hover morph)', () => {
		render(ServiceSvgPanel, { props: { svgContent: '<svg></svg>' } });
		const art = screen.getByTestId('service-svg-panel').querySelector('.svg-art');
		expect(art).toBeTruthy();
		expect(art?.classList.contains('pointer-events-none')).toBe(true);
	});

	it('round 6 — the panel is a tap-able button outside the a11y tree', () => {
		render(ServiceSvgPanel, { props: { svgContent: '<svg></svg>' } });
		const el = screen.getByTestId('service-svg-panel');
		expect(el.tagName).toBe('BUTTON');
		expect(el.getAttribute('type')).toBe('button');
		expect(el.getAttribute('aria-hidden')).toBe('true');
		expect(el.getAttribute('tabindex')).toBe('-1');
	});
});
