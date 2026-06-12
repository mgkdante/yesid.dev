// GO-w2t5 — source locks for the CSS half of the two-tier motion policy.
// CSS @media blocks can't be exercised in happy-dom, so (per the
// tokens.test.ts precedent) we lock the source text instead. The runtime
// behavior is covered by tests/reduced-motion.spec.ts (Playwright).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');

describe('GO-w2t5 motion policy — MOTION-GATED CSS surfaces park under reduce', () => {
	it('WeatherScene: every animated scene class sits in a prefers-reduced-motion block with animation none', () => {
		// GO Wave 4: the About weather card became a full scene system — the
		// particle/scene CSS moved from AboutWeather.svelte to WeatherScene.svelte
		// and the animated surface grew (sun, moon, stars, clouds, drops, flakes,
		// bolt, flash veil, fog banks). All of it is infinite ambient motion →
		// MOTION-GATED: one reduce block parks everything at designed base styles.
		const src = read('src/lib/components/about/WeatherScene.svelte');
		const idx = src.indexOf('@media (prefers-reduced-motion: reduce)');
		expect(idx, 'WeatherScene must carry a reduce block').toBeGreaterThan(-1);
		const tail = src.slice(idx);
		for (const cls of [
			'.weather-drop',
			'.weather-flake',
			'.weather-lightning',
			'.weather-sun',
			'.weather-cloud',
			'.weather-mist',
			'.weather-moon',
			'.weather-star',
			'.weather-bolt',
		]) {
			expect(tail, `${cls} must be reduce-gated`).toContain(cls);
		}
		expect(tail).toContain('animation: none');
	});

	it('WeatherScene: the reduce state is a composed still, not frozen-mid-fall', () => {
		// Precipitation rests at designed scatter positions (base `top` reads the
		// inline --top custom prop; keyframes only override it while motion is
		// allowed) and the bolt stays lit while the flash veil stays off.
		const src = read('src/lib/components/about/WeatherScene.svelte');
		expect(src).toMatch(/\.weather-drop \{[\s\S]*?top: var\(--top/);
		expect(src).toMatch(/\.weather-flake \{[\s\S]*?top: var\(--top/);
		expect(src).toMatch(/\.weather-bolt \{[\s\S]*?opacity: 0\.9/);
		expect(src).toMatch(/\.weather-lightning \{[\s\S]*?opacity: 0/);
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

describe('GO-w2t5 micro-interactions — SAFE-ALWAYS additions present', () => {
	it('app.css ships a global :focus-visible brand ring in @layer base', () => {
		const appCSS = read('src/app.css');
		expect(appCSS).toMatch(
			/:focus-visible \{\s*outline: 2px solid var\(--primary\);\s*outline-offset: 2px;/,
		);
	});

	it('prose links draw their underline (background-size 0% → 100%)', () => {
		const appCSS = read('src/app.css');
		expect(appCSS).toMatch(/\.prose-dark a \{[\s\S]*?background-size: 0% 1px;/);
		expect(appCSS).toMatch(/\.prose-dark a:hover[\s\S]*?background-size: 100% 1px;/);
	});

	it('footer links draw their underline', () => {
		const src = read('src/lib/components/layout/Footer.svelte');
		expect(src).toContain('footer-link');
		expect(src).toMatch(/\.footer-link \{[\s\S]*?background-size: 0% 1px;/);
	});

	it('contact form caret is brand orange', () => {
		const src = read('src/lib/components/contact/ContactPage.svelte');
		expect(src).toMatch(/\.form-field \{[\s\S]*?caret-color: var\(--primary\);/);
	});

	it('project card pipeline brightens on hover (stroke-opacity only)', () => {
		const src = read('src/lib/components/projects/ProjectCard.svelte');
		expect(src).toMatch(/\.project-card:hover :global\(\.df-line\)/);
		expect(src).toContain('stroke-opacity: 1');
	});
});
