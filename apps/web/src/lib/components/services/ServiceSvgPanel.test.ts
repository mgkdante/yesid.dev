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
});
