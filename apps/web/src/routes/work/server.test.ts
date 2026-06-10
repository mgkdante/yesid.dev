import { describe, expect, it } from 'vitest';
import { GET } from './+server';

describe('GET /work (legacy redirect)', () => {
	it('301s to /projects', () => {
		const res = GET();
		expect(res.status).toBe(301);
		expect(res.headers.get('location')).toBe('/projects');
	});

	it('is edge-cacheable for a day (slice-28.1, audit #24)', () => {
		const res = GET();
		expect(res.headers.get('cache-control')).toBe('public, s-maxage=86400');
	});
});
