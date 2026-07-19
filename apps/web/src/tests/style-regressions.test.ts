// GO-day W2 Track 2 (T1): broken utility classes silently render
// transparent/currentColor. This spec greps the source so they can never
// come back. bg-bg-* / border-bg-* / text-text-* map to no @theme token;
// var(--text-light) is defined nowhere.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { styleRegressionViolations } from '@yesid/gates';
import { YESID_FORBIDDEN } from '../../tools/design-gates';

const SRC = resolve(process.cwd(), 'src');
const UI_SRC = resolve(process.cwd(), 'vendor/design/ui/src');

// Local .svelte tree walk — kept for the app-specific art-direction pinning
// tests below (e.g. the stack-engine CTA-doctrine scan). The BRAND
// FORBIDDEN-utility gate below runs @yesid/gates' own walk internally.
function walk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) walk(p, out);
		else if (p.endsWith('.svelte')) out.push(p);
	}
	return out;
}

// PARITY FLIP (2026-07-03): the brand FORBIDDEN-utility gate is re-seated on
// @yesid/gates (engine styleRegressionViolations + preset YESID_FORBIDDEN,
// both byte-equivalent to yesid.dev @ 2bdb611d — same 5 patterns, same .svelte
// walk under SRC, same 'src'-relative hit format). The app-specific
// art-direction pinning tests below stay LOCAL — they are the per-app taste
// contract, not brand gates.
describe('style regressions — broken utilities & undefined vars', () => {
	for (const { pattern, reason, hits } of styleRegressionViolations({
		root: SRC,
		forbidden: YESID_FORBIDDEN,
	})) {
		it(`no source file matches ${pattern} (${reason})`, () => {
			expect(hits, hits.join('\n')).toEqual([]);
		});
	}
});

describe('GO2-W5 INTERLOCKING — signal-systems art direction', () => {
	const separator = readFileSync(
		resolve(UI_SRC, 'primitives/separator/separator.svelte'),
		'utf-8',
	);
	const card = readFileSync(resolve(SRC, 'lib/components/ui/card/card.svelte'), 'utf-8');
	const terminalChrome = readFileSync(
		resolve(SRC, 'lib/components/brand/TerminalChrome.svelte'),
		'utf-8',
	);
	const appCss = readFileSync(resolve(SRC, 'app.css'), 'utf-8');
	const terminalCss = readFileSync(resolve(SRC, 'lib/styles/terminal.css'), 'utf-8');
	const footer = readFileSync(resolve(SRC, 'lib/components/layout/Footer.svelte'), 'utf-8');

	it('hazard separator is real tape — theme-invariant hazard tokens, not primary/background', () => {
		expect(separator).toContain('var(--hazard-a)');
		expect(separator).toContain('var(--hazard-b)');
		expect(separator).not.toMatch(/repeating-linear-gradient\([^)]*var\(--primary\)/);
	});

	it('card surface lifts off the board (surface-2 + edge-highlight bevel, solid)', () => {
		expect(card).toContain('background: var(--surface-2);');
		expect(card).toContain('inset 0 1px 0 var(--edge-highlight)');
	});

	it('terminal chrome strips use the chrome token; body keeps var(--terminal); chassis is the bold rule', () => {
		expect(terminalChrome).toContain('class="terminal-titlebar"');
		expect(terminalCss).toContain('background: var(--terminal-chrome);');
		expect(terminalCss).toContain('background: var(--terminal);');
		// Taste round 2: terminal identity = chrome/border/type — the chassis
		// is the solid-orange structural rule, not a neutral strong border.
		// Round 3: chassis one step thicker (2px).
		expect(terminalCss).toContain('border: 2px solid var(--border-rule);');
	});

	it('terminal footer values speak the wayfinding voice (departure board)', () => {
		expect(terminalChrome).toContain('terminal-footer-value');
		expect(terminalCss).toContain('color: var(--accent-text);');
	});

	it('hero SQL terminal carries the same rule chassis (terminal = page bg, solid, round-3 2px)', () => {
		const sql = readFileSync(resolve(SRC, 'lib/components/home/HeroSqlPanel.svelte'), 'utf-8');
		expect(sql).toContain('border-2 border-[var(--border-rule)]');
		expect(sql).toContain('bg-[var(--terminal)]');
	});

	it('footer platform edge is hazard tape on the muted panel + amber departure rule', () => {
		expect(footer).toContain('var(--hazard-a)');
		expect(footer).toContain('var(--hazard-b)');
		expect(footer).toContain('bg-[var(--muted)]');
		// Taste round 2: the status bar rule is the bold yellow voice.
		// Round 3: one step thicker (2px rule, 3px tape).
		expect(footer).toContain('border-top: 2px solid var(--border-rule-accent);');
		expect(footer).toContain('height: 3px;');
	});

	it('nav chrome joins the brand grid (pill border + dividers = brand-border tokens)', () => {
		const nav = readFileSync(resolve(SRC, 'lib/components/layout/Nav.svelte'), 'utf-8');
		expect(nav).toContain('border: 2px solid var(--border-brand);');
		expect(nav).toContain('background: var(--border-brand);');
	});
});

describe('GO2-W5 round 3 — bolder structure (operator: dividers thicker both modes, light art stronger)', () => {
	const separator = readFileSync(
		resolve(UI_SRC, 'primitives/separator/separator.svelte'),
		'utf-8',
	);
	const card = readFileSync(resolve(SRC, 'lib/components/ui/card/card.svelte'), 'utf-8');
	const shell = readFileSync(
		resolve(UI_SRC, 'brand/BlueprintShell.svelte'),
		'utf-8',
	);
	const servicesBp = readFileSync(
		resolve(SRC, 'lib/components/home/ServicesBlueprint.svelte'),
		'utf-8',
	);

	it('hazard tape is one step thicker in both modes (sm 3px / md 6px / lg 10px)', () => {
		expect(separator).toContain("{ sm: 'h-[3px]', md: 'h-1.5', lg: 'h-2.5' }");
		expect(separator).toContain("{ sm: 'w-[3px]', md: 'w-1.5', lg: 'w-2.5' }");
	});

	it('the brand grid draws at 2px (card surface + section panels)', () => {
		expect(card).toContain('border: 2px solid var(--border-brand);');
		for (const f of ['lib/components/home/HomeServices.svelte']) {
			expect(readFileSync(resolve(SRC, f), 'utf-8'), f).toContain(
				'border: 2px solid var(--border-brand);',
			);
		}
		expect(readFileSync(resolve(SRC, 'lib/components/projects/ProjectCard.svelte'), 'utf-8')).toContain(
			"import { Card } from '$lib/components/ui/card';",
		);
		expect(readFileSync(resolve(SRC, 'lib/components/home/FeaturedProjects.svelte'), 'utf-8')).toContain(
			"import ProjectCard from '$lib/components/projects/ProjectCard.svelte';",
		);
	});

	it('blueprint shells run the round-3 light visibility (hero 0.46 / details 0.42 / 55% / 70%)', () => {
		expect(shell).toContain('opacity: 0.46;');
		expect(shell).toContain('opacity: 0.42 !important;');
		expect(shell).toContain('color-mix(in srgb, var(--primary) 55%, transparent)');
		expect(shell).toContain('color-mix(in srgb, var(--primary) 70%, transparent)');
	});

	it('listing blueprint shells are stronger on mobile without changing desktop base opacity', () => {
		const mobile = shell.slice(shell.indexOf('@media (max-width: 1023px)'));
		const opacityValues = [...mobile.matchAll(/opacity:\s*([0-9.]+)/g)].map((match) =>
			Number(match[1]),
		);
		expect(opacityValues).toEqual([0.3, 0.3, 0.5, 0.46]);
	});

	it('the home services blueprint wall ships light-mode overrides (was dark-only opacities)', () => {
		// Round 3 introduced the light treatment; round 4 boldens it a step
		// (train 0.26 → 0.30, details 0.32 → 0.36, ref labels 70% → 80%).
		expect(servicesBp).toMatch(/\[data-theme='light'\][\s\S]*\.train-svg/);
		expect(servicesBp).toContain('opacity: 0.30;');
		expect(servicesBp).toContain('opacity: 0.36;');
		expect(servicesBp).toContain('color-mix(in srgb, var(--primary) 80%, transparent)');
	});
});

describe('GO2-W5 round 4 — four-color infrastructure doctrine', () => {
	const read = (rel: string) => readFileSync(resolve(SRC, rel), 'utf-8');

	it('home blueprints are boldened in DARK too (operator: "don\'t forget the blueprints on the home page")', () => {
		// The wall shipped dark-tuned subliminal opacities (0.08/0.10) since
		// round 1 — round 4 gives dark its first bolden (0.18/0.22 inline,
		// crosshairs 35%, ref labels 45%).
		const bp = read('lib/components/home/ServicesBlueprint.svelte');
		expect(bp).toContain('opacity-[0.18]');
		expect(bp).toContain('opacity-[0.22]');
		expect(bp).toContain('color-mix(in srgb, var(--primary) 35%, transparent)');
		expect(bp).toContain('color-mix(in srgb, var(--primary) 45%, transparent)');
	});

	it('home blueprint wall keeps the desktop register on mobile and the project fallback is the blueprint sheet (homework #8)', () => {
		const bp = read('lib/components/home/ServicesBlueprint.svelte');
		expect(bp).not.toContain('@media (max-width: 767px)');
		const card = read('lib/components/projects/ProjectCard.svelte');
		expect(card).toContain('project-card-blueprint');
		expect(card).toContain("digital-desktop.svg?raw");
		expect(card).toContain("digital-mobile.svg?raw");
		expect(card).not.toContain('linear-gradient(135deg');
	});

	it('manifesto home art is boldened and the arrival board speaks the YELLOW voice', () => {
		const manifesto = read('lib/components/home/Manifesto.svelte');
		expect(manifesto).toContain('color-mix(in srgb, var(--primary) 6%, transparent)'); // grid 3.5% → 6%
		const transit = read('lib/components/home/ManifestoTransit.svelte');
		const arrival = transit.match(/\.manifesto__arr-label \{([\s\S]*?)\}[\s\S]*?\.manifesto__arr-time \{([\s\S]*?)\}/);
		expect(arrival?.[1]).toContain('color: var(--accent-text);');
		expect(arrival?.[2]).toContain('color: var(--accent-text);');
	});

	it('YELLOW role — station markers/overlines speak accent-text (label-station precedent)', () => {
		expect(read('lib/components/home/HomeServices.svelte')).toMatch(
			/\.services-marker \{[\s\S]*?color: var\(--accent-text\);/,
		);
		// Listing-header sublines are overlines too.
		expect(read('lib/styles/listing-header.css')).toMatch(
			/\.listing-header-subtitle \{[\s\S]*?color: var\(--accent-text\);/,
		);
	});

	it('YELLOW role — metric/number callouts speak accent-text everywhere', () => {
		expect(read('lib/components/brand/MetricDisplay.svelte')).toContain('text-accent-text');
		expect(read('lib/components/home/HomeServices.svelte')).toMatch(
			/\.services-metric-value \{[\s\S]*?color: var\(--accent-text\);/,
		);
		expect(read('lib/components/projects/ProjectCard.svelte')).toMatch(
			/\.proof-metric-value \{[\s\S]*?color: var\(--accent-text\);/,
		);
		expect(read('lib/components/services/ServiceCard.svelte')).toMatch(
			/\.metric-value \{[\s\S]*?color: var\(--accent-text\);/,
		);
		expect(read('lib/components/services/ServiceDetailPage.svelte')).toMatch(
			/\.impact-value \{[\s\S]*?color: var\(--accent-text\);/,
		);
	});

	it('YELLOW role — departure-board/status readouts (footer status line, carousel counter, blog dates)', () => {
		expect(read('lib/components/layout/Footer.svelte')).toMatch(
			/text-\[var\(--accent-text\)\][^>]*>\s*<StatusDot/,
		);
		expect(read('lib/components/home/FeaturedProjects.svelte')).toMatch(
			/\.proof-count-current \{[\s\S]*?color: var\(--accent-text\);/,
		);
		expect(read('lib/components/blog/BlogRow.svelte')).toMatch(
			/\.blog-date \{[\s\S]*?color: var\(--accent-text\);/,
		);
	});

	it('WHITE role: reflective voice: métro dot cores and map cores', () => {
		expect(read('lib/components/projects/DataFlowDiagram.svelte')).toContain('fill="var(--reflective)"');
		expect(read('lib/components/blog/BlogRouteMap.svelte')).toContain('fill: var(--reflective);');
	});

	it('round 4 — blog/projects list items + content blocks draw one step thicker (3px frames)', () => {
		expect(read('lib/components/blog/BlogRow.svelte')).toMatch(
			/\.card-surface\.blog-row\) \{\s*\n\t*border-width: 3px;/,
		);
		expect(read('lib/components/projects/ProjectCard.svelte')).toMatch(
			/\.project-card :global\(\.card-surface\) \{\s*\n\t*border-width: 3px;/,
		);
		expect(read('lib/components/shared/CollapsibleSection.svelte')).toMatch(
			/\.section-card\) \{\s*\n\t*border-width: 3px;/,
		);
	});
});

describe('global readable typography system', () => {
	const read = (rel: string) => readFileSync(resolve(SRC, rel), 'utf-8');
	const tokens = readFileSync(
		resolve(process.cwd(), 'vendor/design/tokens/tokens.css'),
		'utf-8',
	);

	it('defines shared readable text tokens for cards, controls, tags, and back links', () => {
		for (const token of [
			'--text-card-title',
			'--text-card-body',
			'--text-card-meta',
			'--text-control',
			'--text-tag',
			'--text-back-link',
			'--text-detail-body-mobile',
			'--text-detail-body-desktop',
			'--text-detail-meta',
			'--text-detail-kicker',
			'--text-detail-subheading-mobile',
			'--text-detail-subheading-desktop',
			'--text-metric-value-mobile',
			'--text-metric-value-desktop',
			'--text-metric-value-default',
			'--text-nav-brand-mobile',
			'--text-nav-brand-desktop',
			'--text-nav-link-mobile',
			'--text-nav-link-desktop',
			'--text-nav-link-compact',
			'--text-menu-label-mobile',
			'--text-menu-label-desktop',
			'--text-menu-subtitle',
		]) {
			expect(tokens).toContain(token);
		}
	});

	it('routes listing cards and home service cards through card text tokens', () => {
		for (const rel of [
			'lib/components/projects/ProjectCard.svelte',
			'lib/components/blog/BlogRow.svelte',
			'lib/components/home/HomeServices.svelte',
		]) {
			const source = read(rel);
			expect(source, rel).toContain('var(--text-card-title)');
			expect(source, rel).toContain('var(--text-card-body)');
		}
	});

	it('routes equal-intent back links through the shared back-link token', () => {
		for (const rel of [
			'lib/components/projects/ProjectDetailHeader.svelte',
			'lib/components/blog/BlogDetailHeader.svelte',
			'lib/components/services/ServiceDetailPage.svelte',
		]) {
			expect(read(rel), rel).toContain('var(--text-back-link)');
		}
	});

	it('routes mobile filters and tags through shared control tokens', () => {
		expect(read('lib/styles/listing-shell.css')).toContain('var(--text-control)');
		expect(read('lib/components/projects/ProjectCard.svelte')).toContain('var(--text-tag)');
		expect(read('lib/components/blog/BlogRow.svelte')).toContain('var(--text-tag)');
	});

	it('mobile filter collapse uses bare selectors (global CSS file, no Svelte :global)', () => {
		// listing-shell.css is imported as a GLOBAL stylesheet, not a Svelte <style>
		// block, so a :global(...) wrapper is invalid CSS and the browser drops the
		// whole rule — which silently left the mobile filter panel permanently
		// expanded. Bare selectors apply globally; this guards the fix.
		const shell = read('lib/styles/listing-shell.css');
		expect(shell).not.toContain(':global(');
		expect(shell).toContain('.mobile-filter-body[data-state="open"]');
	});

	it('routes detail body, nav, and menu sizing through semantic mobile/desktop tokens', () => {
		expect(read('lib/components/blog/BlogDetailPage.svelte')).toContain('var(--text-detail-body-mobile)');
		expect(read('lib/components/blog/BlogDetailPage.svelte')).toContain('var(--text-detail-body-desktop)');
		expect(read('lib/components/projects/ProjectDetailPage.svelte')).toContain('var(--text-detail-body-mobile)');
		expect(read('lib/components/projects/ProjectDetailPage.svelte')).toContain('var(--text-detail-body-desktop)');

		const nav = read('lib/components/layout/Nav.svelte');
		expect(nav).toContain('var(--text-nav-brand-desktop)');
		expect(nav).toContain('var(--text-nav-brand-mobile)');
		expect(nav).toContain('var(--text-nav-link-desktop)');
		expect(nav).toContain('var(--text-nav-link-mobile)');
		expect(nav).toContain('var(--text-nav-link-compact)');

		const menu = read('lib/components/layout/MenuOverlay.svelte');
		expect(menu).toContain('var(--text-menu-label-mobile)');
		expect(menu).toContain('var(--text-menu-label-desktop)');
		expect(menu).toContain('var(--text-menu-subtitle)');
	});
});

describe('GO2-W5 round 5 — closer: fun SVGs, card parity, bolder rails, yellow-conversion doctrine', () => {
	const read = (rel: string) => readFileSync(resolve(SRC, rel), 'utf-8');

	it('R5-1 — home service art is the hero again (128px tile / 96px art) with the light-register remap', () => {
		const home = read('lib/components/home/HomeServices.svelte');
		expect(home).toMatch(/button\.services-svg-panel \{[\s\S]*?width: 128px;\s*\n\t*height: 128px;/);
		expect(home).toMatch(/\.svg-inline-wrapper \{\s*\n\t*width: 96px;\s*\n\t*height: 96px;/);
		// ~40% of the art strokes var(--accent) (#FFB627, theme-unmapped) —
		// remapped to --line-amber inside the art scope so it survives paper.
		expect(home).toMatch(/\.svg-inline-wrapper \{[\s\S]*?--accent: var\(--line-amber\);/);
	});

	it('R5-1 — services panel runs the same remap + the fluid icon cap (desktop only)', () => {
		const panel = read('lib/components/services/ServiceSvgPanel.svelte');
		expect(panel).toMatch(/\.svg-art \{[\s\S]*?--accent: var\(--line-amber\);/);
		expect(panel).toMatch(/@media \(min-width: 768px\) \{[\s\S]*?width: min\(224px, 100%\) !important;/);
		// Panel-wide hover drives the morph (round 6 renames the state to
		// panelMorphed — hover AND tap share the one switch).
		expect(panel).toContain('hovered={panelMorphed}');
	});

	it('R5b — four stations, uniform 2-up desktop grid on home', () => {
		expect(read('lib/components/home/HomeServices.svelte')).toContain('lg:grid-cols-2');
		expect(read('lib/components/home/HomeServices.svelte')).not.toContain('lg:grid-cols-3');
	});

	it('R5-2 — ProjectCard chassis is EXACTLY the blog list card (no extra inset route strip)', () => {
		const card = read('lib/components/projects/ProjectCard.svelte');
		// The round-1 "route lights up" inset painted a 2px primary band inside
		// the left border — the chassis must be the bare .card-surface + 3px.
		expect(card).not.toContain('inset 2px 0 0');
		expect(card).toMatch(/\.project-card :global\(\.card-surface\) \{\s*\n\t*border-width: 3px;/);
	});

	it('R5-3 — listing rails one step bolder (2px rule @35%, dots up a step) in blog/projects/contact', () => {
		for (const f of [
			'routes/[[lang=locale]]/blog/+layout.svelte',
			'routes/[[lang=locale]]/projects/+layout.svelte',
		]) {
			const layout = readFileSync(resolve(SRC, f), 'utf-8');
			expect(layout, f).toContain('grid-template-columns: auto 2px 1fr;');
			expect(layout, f).toMatch(/\.accent-rail \{[\s\S]*?color-mix\(in srgb, var\(--primary\) 35%, transparent\)/);
			expect(layout, f).toMatch(/\.metro-line \{\s*\n\t*width: 2px;/);
			expect(layout, f).toMatch(/\.metro-dot-lg \{\s*\n\t*width: 10px;/);
		}
		const contact = read('lib/components/contact/ContactPage.svelte');
		expect(contact).toContain('grid-template-columns: auto 2px 1fr;');
		expect(contact).toMatch(/\.accent-rail \{[\s\S]*?color-mix\(in srgb, var\(--primary\) 35%, transparent\)/);
	});

	it('R5-3 — metro timeline spine draws at 3px with the bolder 32px roundel', () => {
		const metro = readFileSync(resolve(UI_SRC, 'brand/MetroStation.svelte'), 'utf-8');
		const adapter = read('lib/components/brand/MetroStation.svelte');
		expect(metro).toContain('viewBox="0 0 3 100"');
		expect(metro.match(/stroke-width="3"/g)?.length).toBe(2);
		expect(metro).toMatch(/\[data-slot='badge'\]\.station-number-badge\) \{[\s\S]*?width: 2rem;/);
		expect(adapter).toContain('class="station-number-badge"');
	});

	it('R5c — yellow-conversion doctrine: the conversion variant exists and carries the signage pair', () => {
		const button = read('lib/components/ui/button/button.svelte');
		expect(button).toContain('conversion: "bg-accent text-signage-bg hover:bg-accent-hover');
		// The signage utilities must stay mapped in the Tailwind theme.
		const appCss = readFileSync(resolve(process.cwd(), 'src/app.css'), 'utf-8');
		expect(appCss).toContain('--color-signage-bg: var(--signage-bg);');
		expect(appCss).toContain('--color-signage-text: var(--signage-text);');
	});

	it('R5c — every conversion-to-contact moment is yellow (≤1 per view): contact submit, hero contact, about send, closer CTA', () => {
		expect(read('lib/components/contact/ContactPage.svelte')).toMatch(
			/<Button\s+variant="conversion"\s+size="cta"\s+type="submit"/,
		);
		expect(read('lib/components/home/HeroTextContent.svelte')).toMatch(
			/<Button variant="conversion"[^>]*data-testid="hero-cta-contact"/,
		);
		expect(read('lib/components/about/AboutCta.svelte')).toMatch(
			/<Button variant="conversion" size="cta" href=\{cta\.buttonHref\}/,
		);
		const closer = read('lib/components/home/HomeCloser.svelte');
		expect(closer).toMatch(/\.closer-cta \{[\s\S]*?color: var\(--signage-bg\);[\s\S]*?background: var\(--accent\);/);
		expect(closer).toMatch(/\.closer-cta:hover \{[\s\S]*?background: var\(--accent-hover\);/);
	});

	it('R5c — everything else stays orange: deep dives + view-alls keep primary; stack-engine untouched', () => {
		// Deep-dive CTAs (services listing/detail) stay route-set orange.
		expect(read('lib/components/services/ServiceCard.svelte')).toMatch(
			/\.deep-dive-cta \{[\s\S]*?background: var\(--primary\);/,
		);
		// Home view-all links stay orange.
		expect(read('lib/components/home/HomeServices.svelte')).toMatch(
			/\.home-view-all \{\s*\n\t*color: var\(--primary\);/,
		);
		// Hero projects CTA stays the default orange variant.
		expect(read('lib/components/home/HeroTextContent.svelte')).toMatch(
			/<Button variant="default"[^>]*data-testid="hero-cta-projects"/,
		);
		// Stack-engine is out of scope (engine branch owns its CTA).
		const engineDir = resolve(SRC, 'lib/components/stack-engine');
		const engineHits = walk(engineDir).filter((f) =>
			readFileSync(f, 'utf-8').includes('variant="conversion"'),
		);
		expect(engineHits).toEqual([]);
	});
});

describe('GO-W2.2 T7 — art direction', () => {
	const closer = readFileSync(resolve(SRC, 'lib/components/home/HomeCloser.svelte'), 'utf-8');
	const error = readFileSync(resolve(SRC, 'lib/components/shared/ErrorIllustration.svelte'), 'utf-8');
	const metro = readFileSync(resolve(SRC, 'lib/motion/svg/MetroNetwork.svelte'), 'utf-8');

	it('home closer follows the active theme (go2/w4: theme-dark pin removed)', () => {
		// Operator QA: the pinned-dark wrapper read as an "extra layer" on the
		// closer terminal and kept it dark in light mode. The closer now follows
		// the active theme — terminals are a single clean themed surface.
		// (Class attributes only — comments may reference the removed pin.)
		// Round 6 supersedes the w4 solid paint: the section is TRANSPARENT
		// (locked in the round-6 block below).
		expect(closer).not.toMatch(/class="[^"]*theme-dark[^"]*"/);
	});

	it('404 illustration has no white-alpha hardcodes', () => {
		expect(error).not.toContain('rgba(255,255,255');
	});

	it('metro network ships light-theme attribute overrides', () => {
		expect(metro).toContain('[data-theme="light"]');
		expect(metro).toContain('fill: var(--muted);');
	});
});

describe('GO2-W5 round 6 — transparent terminus, detail SVGs back, top-band parity', () => {
	const read = (rel: string) => readFileSync(resolve(SRC, rel), 'utf-8');

	it('R6-1 — the home closer section is TRANSPARENT: the circuit grid shows through', () => {
		// Operator: the terminus paints nothing of its own — solidity lives in
		// the terminal board inside (--terminal === --background, round-2
		// contract). No solid section paint may come back in either theme.
		const closer = read('lib/components/home/HomeCloser.svelte');
		expect(closer).toMatch(/\.closer-section \{[\s\S]*?background: transparent;/);
		expect(closer).not.toContain('background: var(--background);');
	});

	it('R6-2 — detail page text leads and art sits on the RIGHT of the hero', () => {
		const detail = read('lib/components/services/ServiceDetailPage.svelte');
		// Source order: the text column precedes the svg column so desktop
		// reads copy first while mobile keeps its text-first stack.
		const svgIdx = detail.indexOf('class="svg-desktop"');
		const textIdx = detail.indexOf('class="hero-text"');
		expect(svgIdx).toBeGreaterThan(-1);
		expect(textIdx).toBeGreaterThan(-1);
		expect(textIdx).toBeLessThan(svgIdx);
		// …and the grid puts the flexible text track first, auto art track last.
		expect(detail).toMatch(/\.hero-grid \{[\s\S]*?grid-template-columns: 1fr auto;/);
	});

	it('R6-2 — the panel morphs on hover AND tap (button toy, slice-09 semantics)', () => {
		const panel = read('lib/components/services/ServiceSvgPanel.svelte');
		// A real <button> owns the tap; pointerenter/leave own the hover —
		// filtered to non-touch so a tap can't cancel its own toggle.
		expect(panel).toMatch(/<button\s+type="button"/);
		expect(panel).toContain('onclick={() => (panelMorphed = !panelMorphed)}');
		expect(panel).toMatch(/onpointerenter=\{[\s\S]*?pointerType !== 'touch'[\s\S]*?panelMorphed = true/);
		expect(panel).toContain('hovered={panelMorphed}');
	});

	it('R6-3 — services PAGE BODY is transparent (grid shows through), but the sticky-tabs nav-gap band is SOLID', () => {
		// The page fill stays transparent so the single root .circuit-grid reads
		// through the content (matches /projects + the R6-1 closer). BUT the
		// .tabs-bar::before nav-gap backdrop above the sticky tabs is now a SOLID
		// var(--background) band: transparent there let service content scroll up
		// and bleed through above the orange tabs, which looked broken (operator
		// QA, 2026-06-13). Same colour as the background, so it reads as clean
		// empty space rather than a visible bar.
		const listing = read('lib/components/services/ServiceListingPage.svelte');
		const detail = read('lib/components/services/ServiceDetailPage.svelte');
		expect(listing).toMatch(/\.tabs-bar::before \{[\s\S]*?background: var\(--background\);/);
		expect(detail).toMatch(/\.tabs-bar::before \{[\s\S]*?background: var\(--background\);/);
		// Page body fill stays transparent — the grid still shows through content.
		// Scope to the rule block ([^}]*) so it can't match the band's var(--background) below.
		expect(listing).not.toMatch(/\.services-page \{[^}]*background: var\(--background\);/);
		expect(detail).not.toMatch(/\.service-detail \{[^}]*background: var\(--background\);/);
	});
});

describe('GO2-W5 final batch (6b) — ONE tape at the footer seam', () => {
	// The footer's platform-edge hazard tape owns the footer seam (round 4).
	// A page whose template ENDS with its own hazard separator stacks TWO
	// tapes at that seam (operator QA caught About + the error page doing
	// this). Rule: after the LAST page-level hazard separator there must be
	// real rendered content — otherwise the tape sits against the footer.
	const PAGE_TEMPLATES = [
		'lib/components/home/HomePage.svelte',
		'lib/components/about/AboutPage.svelte',
		'lib/components/contact/ContactPage.svelte',
		'lib/components/projects/ProjectListingPage.svelte',
		'lib/components/projects/ProjectDetailPage.svelte',
		'lib/components/services/ServiceListingPage.svelte',
		'lib/components/services/ServiceDetailPage.svelte',
		'lib/components/blog/BlogListingPage.svelte',
		'lib/components/blog/BlogDetailPage.svelte',
		'routes/[[lang=locale]]/tech-stack/+page.svelte',
		'routes/+error.svelte',
	];

	it.each(PAGE_TEMPLATES)(
		'%s does not end with a hazard separator (footer platform edge owns the seam)',
		(rel) => {
			const src = readFileSync(resolve(SRC, rel), 'utf-8');
			const template = src.split(/<style[\s>]/)[0];
			const lastHazard = template.lastIndexOf('variant="hazard"');
			if (lastHazard === -1) return; // page renders no tape of its own — fine
			const after = template.slice(lastHazard);
			// Strip the rest of the separator tag, then comments, closing tags
			// and svelte block closers. Anything left = real content below the
			// tape; nothing left = the tape is the page bottom (double tape).
			const tail = after
				.slice(after.indexOf('>') + 1)
				.replace(/<!--[\s\S]*?-->/g, '')
				.replace(/<\/[a-zA-Z][^>]*>/g, '')
				.replace(/\{\/(if|each|key|await|snippet)\}/g, '')
				.trim();
			expect(
				tail,
				`${rel}: template ends with a hazard separator — the footer's platform-edge tape already owns this seam`,
			).not.toBe('');
		},
	);
});

describe('GO2-W5 final batch (6c) — the asphalt footer is BELOVED (never repave)', () => {
	// Operator: "the footer being that asphalt color was amazing!" The footer
	// is the street beneath the platform-edge tape: bg-[var(--muted)] — the
	// asphalt road surface in dark (#1E1E1E, locked in tokens.test) and the
	// approved station paper in light (#E4E9F3). Wiring locked here so no
	// future pass repaves the footer onto another surface token.
	const footer = readFileSync(resolve(SRC, 'lib/components/layout/Footer.svelte'), 'utf-8');

	it('the footer element paints the muted street panel — not background/card/popover', () => {
		expect(footer).toMatch(/<footer[^>]*class="[^"]*bg-\[var\(--muted\)\]/);
		expect(footer).not.toMatch(/<footer[^>]*class="[^"]*bg-\[var\(--background\)\]/);
		expect(footer).not.toMatch(/<footer[^>]*class="[^"]*bg-\[var\(--card\)\]/);
		expect(footer).not.toMatch(/<footer[^>]*class="[^"]*bg-\[var\(--popover\)\]/);
	});

	it('the platform-edge tape still sits on the street (hazard tokens, 3px band)', () => {
		expect(footer).toMatch(
			/\.footer-gradient-sep \{[\s\S]*?height: 3px;[\s\S]*?var\(--hazard-a\)[\s\S]*?var\(--hazard-b\)/,
		);
	});
});
