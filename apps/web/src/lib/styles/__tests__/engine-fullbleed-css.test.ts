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
		expect(src).toContain("import { Separator } from '$lib/components/ui/separator'");
		const hazards = src.match(/variant="hazard"/g) ?? [];
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

	it('finale 4d: the HERO is full-bleed too — the old constrained-hero rule is superseded for THIS page', () => {
		const src = page();
		const hero = src.match(/\.hero \{[^}]*\}/);
		expect(hero, '.hero rule must exist').not.toBeNull();
		// No width cap — the control room runs edge to edge; gutters come from
		// the shared --space-page-x padding.
		expect(hero![0]).not.toContain('max-width');
		expect(hero![0]).toContain('var(--space-page-x)');
		// One continuous instrument panel: the hero carries the SAME brand tint
		// as the engine band; the hazard strip is the seam between them.
		expect(hero![0]).toMatch(/color-mix\(in srgb, var\(--primary\)/);
		// No dead air between hero and band — margin-top is gone.
		expect(src).toMatch(/\.engine-band \{[^}]*margin: 0 0 /);
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
