import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
	resolve(process.cwd(), 'src/lib/components/home/HeroBanner.svelte'),
	'utf8',
);

describe('HeroBanner live KPI polling boundary', () => {
	it('delegates automatic polling and tears down the helper lifecycle', () => {
		expect(source).toMatch(
			/import\s*\{[^}]*startLiveKpiPolling[^}]*\}\s*from\s*['"]\$lib\/content\/live-kpis['"]/s,
		);
		expect(source).toMatch(
			/const stopLivePolling = startLiveKpiPolling\(tickLive\);[\s\S]*return \(\) => \{[\s\S]*stopLivePolling\(\);/,
		);
		expect(source).not.toMatch(/setInterval\(tickLive\s*,/);
	});
});
