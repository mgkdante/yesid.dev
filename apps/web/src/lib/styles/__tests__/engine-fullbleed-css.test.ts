// GO-w2t5 operator addendum — source locks for the /tech-stack full-bleed
// engine band. CSS layout can't be exercised in happy-dom, so (per the
// tokens.test.ts / motion-policy-css.test.ts precedent) we lock the source
// text; computed-layout behavior is covered by tests/stack-engine.spec.ts
// ("engine band is full-bleed…", Playwright).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');

describe('GO-w2t5 addendum — /tech-stack full-bleed engine band', () => {
	const page = () => read('src/routes/[[lang=locale]]/tech-stack/+page.svelte');
	const engine = () => read('src/lib/components/stack-engine/Engine.svelte');

	it('route wraps the engine zone in an engine-band framed by TWO hazard separators', () => {
		const src = page();
		expect(src).toContain('data-testid="engine-band"');
		// Reuse the shared hazard composable (the /projects dashed orange divider) —
		// no reinvented stripe gradients in the route.
		expect(src).toContain(
			"import HazardSeparator from '$lib/components/shared/HazardSeparator.svelte'",
		);
		const hazards = src.match(/<HazardSeparator/g) ?? [];
		expect(hazards).toHaveLength(2);
	});

	it('engine-band is full-bleed: no max-width cap on the band rule', () => {
		const src = page();
		const rule = src.match(/\.engine-band \{[^}]*\}/);
		expect(rule, '.engine-band rule must exist').not.toBeNull();
		expect(rule![0]).not.toContain('max-width');
	});

	it('band carries the brand tint (cute-pass anchor)', () => {
		const src = page();
		expect(src).toMatch(/\.engine-band \{[^}]*color-mix\(in srgb, var\(--primary\)/);
	});

	it('finale 4d + micro-pass 4e: the HERO is full-bleed on the PLAIN site background — the tint is the band\'s alone', () => {
		const src = page();
		const hero = src.match(/\.hero \{[^}]*\}/);
		expect(hero, '.hero rule must exist').not.toBeNull();
		// No width cap — the control room runs edge to edge; gutters come from
		// the shared --space-page-x padding.
		expect(hero![0]).not.toContain('max-width');
		expect(hero![0]).toContain('var(--space-page-x)');
		// Micro-pass (4e), operator verdict: hero background = plain site
		// background ("just usual black" in dark, plain paper in light). NO
		// background declaration on the hero rule at all — the 3% brand tint
		// belongs to the engine band alone (asserted above), and the hazard
		// strip is the band's front edge, not a seam between tinted panels.
		expect(hero![0]).not.toContain('background');
		expect(hero![0]).not.toContain('color-mix');
		// No dead air between hero and band — margin-top is gone.
		expect(src).toMatch(/\.engine-band \{[^}]*margin: 0 0 /);
	});

	it('micro-pass 4f: two-column control room on desktop — reading column dominant (~60/40), stacked below 768px', () => {
		const src = page();
		// Single-column base (mobile stacks in source order)…
		expect(src).toMatch(/\.hero-columns \{[^}]*display: grid;[^}]*grid-template-columns: 1fr;/);
		// …and the ≥768px grid is left-dominant 3fr/2fr with aligned bottoms
		// (one rhythm line: terminal prompt and action row share the rail).
		const desktop = src.match(/@media \(min-width: 768px\) \{[\s\S]*?\n\t\}/);
		expect(desktop, 'desktop hero media block must exist').not.toBeNull();
		expect(desktop![0]).toMatch(
			/\.hero-columns \{[^}]*grid-template-columns: minmax\(0, 3fr\) minmax\(0, 2fr\);[^}]*align-items: end;/,
		);
	});

	it('micro-pass 4f: yellow-conversion rule — hero get-in-touch wears the signage pairing; view-services stays standard', () => {
		const src = page();
		// Markup: ONLY the get-in-touch button carries the local class.
		const talks = src.match(/class="hero-cta-talk"/g) ?? [];
		expect(talks).toHaveLength(1);
		expect(src).toMatch(/class="hero-cta-talk" href=\{localizeHref\('\/contact'/);
		// CSS: the BlueprintCTA recipe verbatim — --accent under fixed
		// near-black ink, hover steps to --accent-hover (never orange).
		expect(src).toMatch(
			/:global\(\.hero-cta-talk\) \{[^}]*background: var\(--accent\);[^}]*color: #1C1814;/,
		);
		expect(src).toMatch(
			/:global\(\.hero-cta-talk:hover\) \{[^}]*background: var\(--accent-hover\);[^}]*color: #1C1814;/,
		);
		// The standard (orange) services button never picks up the class.
		expect(src).toMatch(/<Button variant="outline" size="cta" href=\{localizeHref\('\/services'/);
	});

	it('finale 4d: hero type commands the viewport (clamped big, viewport-driven)', () => {
		const src = page();
		expect(src).toMatch(/\.hero-title \{[^}]*font-size: clamp\(2\.75rem, 8vw, 7\.5rem\);/);
		expect(src).toMatch(/\.stack-explainer \{[^}]*font-size: clamp\(/);
		expect(src).toMatch(/\.hero-terminal \{[^}]*font-size: clamp\(13px/);
	});

	it("CTA below keeps its constrained width EXACTLY ('perfect that way' still holds under the panel)", () => {
		const src = page();
		expect(src).toMatch(/\.cta-zone \{[^}]*max-width: var\(--container-wide\);/);
	});

	it('taste round 2: the WHOLE engine chain is uncapped — section AND inner (gutters via padding only)', () => {
		const src = engine();
		const sectionRule = src.match(/\.stack-engine \{[^}]*\}/);
		expect(sectionRule, '.stack-engine rule must exist').not.toBeNull();
		expect(sectionRule![0]).not.toContain('max-width');
		// Operator verdict (round 2): the engine "still feels constrained" —
		// .engine-inner's container-wide cap was re-constraining the content
		// the band had just un-constrained. No width cap anywhere in the
		// engine; readable gutters come from the section's --space-page-x
		// padding.
		const innerRule = src.match(/\.engine-inner \{[^}]*\}/);
		expect(innerRule, '.engine-inner rule must exist').not.toBeNull();
		expect(innerRule![0]).not.toContain('max-width');
		expect(sectionRule![0]).toContain('var(--space-page-x)');
	});

	it('taste round 2: the loading placeholder inside the band is uncapped too (no constrained flash)', () => {
		const src = page();
		const rule = src.match(/\.engine-loading \{[^}]*\}/);
		expect(rule, '.engine-loading rule must exist').not.toBeNull();
		expect(rule![0]).not.toContain('max-width');
		expect(rule![0]).toContain('var(--space-page-x)');
	});
});
