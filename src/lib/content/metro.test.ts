import { describe, it, expect } from 'vitest';
import { metroStops, TOTAL_STOPS, formatStopLabel, formatServicesLabel, getStopByType } from './metro.js';
import { services } from './services.js';

describe('metro line', () => {
	it('has the correct total stops', () => {
		// hero + services + featured + about + blog + terminal = services.length + 5
		expect(TOTAL_STOPS).toBe(services.length + 5);
		expect(metroStops.length).toBe(TOTAL_STOPS);
	});

	it('first stop is hero with number 00', () => {
		expect(metroStops[0].type).toBe('hero');
		expect(metroStops[0].stopNumber).toBe('00');
		expect(metroStops[0].id).toBe('departure');
	});

	it('last stop is terminal', () => {
		const last = metroStops[metroStops.length - 1];
		expect(last.type).toBe('terminal');
		expect(last.stopNumber).toBe('TERMINAL');
	});

	it('service stops have sequential numbering starting from 01', () => {
		const serviceStops = metroStops.filter((s) => s.type === 'service');
		expect(serviceStops.length).toBe(services.length);

		serviceStops.forEach((stop, i) => {
			expect(stop.stopNumber).toBe(String(i + 1).padStart(2, '0'));
			expect(stop.id).toBe(services[i].id);
		});
	});

	it('fixed sections follow services with auto-incremented numbers', () => {
		const featured = getStopByType('featured');
		const about = getStopByType('about');
		const blog = getStopByType('blog');

		const base = services.length + 1;
		expect(featured?.stopNumber).toBe(String(base).padStart(2, '0'));
		expect(about?.stopNumber).toBe(String(base + 1).padStart(2, '0'));
		expect(blog?.stopNumber).toBe(String(base + 2).padStart(2, '0'));
	});

	it('every stop has a non-empty English label', () => {
		for (const stop of metroStops) {
			expect(stop.label.en.length).toBeGreaterThan(0);
		}
	});
});

describe('formatStopLabel', () => {
	it('formats a numbered stop', () => {
		const featured = getStopByType('featured')!;
		expect(formatStopLabel(featured)).toMatch(/^STOP \d{2} — FEATURED WORK$/);
	});

	it('formats terminal stop', () => {
		const terminal = getStopByType('terminal')!;
		expect(formatStopLabel(terminal)).toBe('TERMINAL — FINAL DESTINATION');
	});
});

describe('formatServicesLabel', () => {
	it('includes correct range', () => {
		const label = formatServicesLabel();
		const last = String(services.length).padStart(2, '0');
		expect(label).toBe(`STOPS 01–${last} — SERVICES`);
	});
});
