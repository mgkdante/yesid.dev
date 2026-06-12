// GO-2 Track 3: archived service slugs 301 to their merge survivors.
// Same raw-Response edge-cached pattern as routes/work/+server.ts.
import { describe, it, expect } from 'vitest';
import { GET as sqlDevelopmentGET } from './sql-development/+server';
import { GET as internalToolingGET } from './internal-tooling/+server';

describe('archived service slug redirects (GO-2 consolidation)', () => {
	it('/services/sql-development 301s to /services/database-engineering with edge cache', () => {
		const res = sqlDevelopmentGET();
		expect(res.status).toBe(301);
		expect(res.headers.get('location')).toBe('/services/database-engineering');
		expect(res.headers.get('cache-control')).toBe('public, s-maxage=86400');
	});

	it('/services/internal-tooling 301s to /services/data-pipeline with edge cache', () => {
		const res = internalToolingGET();
		expect(res.status).toBe(301);
		expect(res.headers.get('location')).toBe('/services/data-pipeline');
		expect(res.headers.get('cache-control')).toBe('public, s-maxage=86400');
	});
});
