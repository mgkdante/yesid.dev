// GO-w2t5 — source locks for the CSS half of the two-tier motion policy.
// CSS @media blocks can't be exercised in happy-dom, so (per the
// tokens.test.ts precedent) we lock the source text instead. The runtime
// behavior is covered by tests/reduced-motion.spec.ts (Playwright).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');

describe('GO-w2t5 motion policy — MOTION-GATED CSS surfaces park under reduce', () => {
	it('AboutWeather: every particle class sits in a prefers-reduced-motion block with animation none', () => {
		const src = read('src/lib/components/about/AboutWeather.svelte');
		const idx = src.indexOf('@media (prefers-reduced-motion: reduce)');
		expect(idx, 'AboutWeather must carry a reduce block').toBeGreaterThan(-1);
		const tail = src.slice(idx);
		for (const cls of [
			'.weather-drop',
			'.weather-flake',
			'.weather-lightning',
			'.weather-sun',
			'.weather-cloud',
			'.weather-mist',
		]) {
			expect(tail, `${cls} must be reduce-gated`).toContain(cls);
		}
		expect(tail).toContain('animation: none');
	});

	it('Nav: the collapsible link slide snaps (transition none) under reduce', () => {
		const src = read('src/lib/components/layout/Nav.svelte');
		expect(src).toMatch(
			/@media \(prefers-reduced-motion: reduce\) \{\s*\.nav-collapsible \{\s*transition: none;/,
		);
	});

	it('ProjectCard: the image hover zoom rests under reduce', () => {
		const src = read('src/lib/components/projects/ProjectCard.svelte');
		expect(src).toContain('project-card-img');
		expect(src).toMatch(
			/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.project-card-img[\s\S]*?scale: 1/,
		);
	});
});
