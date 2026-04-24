// Metro-line derivation tests — moved from content/metro.test.ts in Task 17b-3.
// Same assertions as before; the functions under test are async now because
// they go through the adapter.

import { describe, it, expect } from 'vitest';
import {
	getMetroStops,
	getTotalStops,
	formatStopLabel,
	formatServicesLabel,
	getStopByType,
} from './service';
import { services } from '$lib/content/services';

describe('metro line', () => {
	it('has the correct total stops', async () => {
		// hero + services + featured + about + blog + terminal = services.length + 5
		const total = await getTotalStops();
		const stops = await getMetroStops();
		expect(total).toBe(services.length + 5);
		expect(stops.length).toBe(total);
	});

	it('first stop is hero with number 00', async () => {
		const stops = await getMetroStops();
		expect(stops[0].type).toBe('hero');
		expect(stops[0].stopNumber).toBe('00');
		expect(stops[0].id).toBe('departure');
	});

	it('last stop is terminal', async () => {
		const stops = await getMetroStops();
		const last = stops[stops.length - 1];
		expect(last.type).toBe('terminal');
		expect(last.stopNumber).toBe('TERMINAL');
	});

	it('service stops have sequential numbering starting from 01', async () => {
		const stops = await getMetroStops();
		const serviceStops = stops.filter((s) => s.type === 'service');
		expect(serviceStops.length).toBe(services.length);

		serviceStops.forEach((stop, i) => {
			expect(stop.stopNumber).toBe(String(i + 1).padStart(2, '0'));
			expect(stop.id).toBe(services[i].id);
		});
	});

	it('fixed sections follow services with auto-incremented numbers', async () => {
		const featured = await getStopByType('featured');
		const about = await getStopByType('about');
		const blog = await getStopByType('blog');

		const base = services.length + 1;
		expect(featured?.stopNumber).toBe(String(base).padStart(2, '0'));
		expect(about?.stopNumber).toBe(String(base + 1).padStart(2, '0'));
		expect(blog?.stopNumber).toBe(String(base + 2).padStart(2, '0'));
	});

	it('every stop has a non-empty English label', async () => {
		const stops = await getMetroStops();
		for (const stop of stops) {
			expect(stop.label.en.length).toBeGreaterThan(0);
		}
	});
});

describe('formatStopLabel', () => {
	it('formats a numbered stop', async () => {
		const featured = await getStopByType('featured');
		expect(formatStopLabel(featured!)).toMatch(/^STOP \d{2} — FEATURED WORK$/);
	});

	it('formats terminal stop', async () => {
		const terminal = await getStopByType('terminal');
		expect(formatStopLabel(terminal!)).toBe('TERMINAL — FINAL DESTINATION');
	});
});

describe('formatServicesLabel', () => {
	it('includes correct range', async () => {
		const label = await formatServicesLabel();
		const last = String(services.length).padStart(2, '0');
		expect(label).toBe(`STOPS 01–${last} — SERVICES`);
	});
});
