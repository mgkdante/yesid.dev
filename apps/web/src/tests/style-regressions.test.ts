// GO-day W2 Track 2 (T1): broken utility classes silently render
// transparent/currentColor. This spec greps the source so they can never
// come back. bg-bg-* / border-bg-* / text-text-* map to no @theme token;
// var(--text-light) is defined nowhere.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const SRC = resolve(process.cwd(), 'src');

function walk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) walk(p, out);
		else if (p.endsWith('.svelte')) out.push(p);
	}
	return out;
}

const files = walk(SRC);

const FORBIDDEN: Array<{ pattern: RegExp; reason: string }> = [
	{ pattern: /\bbg-bg-/, reason: 'bg-bg-* is not a token utility (use bg-background / bg-card)' },
	{ pattern: /\bborder-bg-/, reason: 'border-bg-* is not a token utility (use border-border-subtle)' },
	{ pattern: /\btext-text-/, reason: 'text-text-* is not a token utility (use text-secondary-foreground)' },
	{ pattern: /var\(--text-light\)/, reason: '--text-light is undefined (use var(--secondary-foreground))' },
	{ pattern: /var\(--dim-foreground\)|var\(--light-foreground\)/, reason: 'aliases to undefined vars (archived in app.css)' },
];

describe('style regressions — broken utilities & undefined vars', () => {
	for (const { pattern, reason } of FORBIDDEN) {
		it(`no source file matches ${pattern} (${reason})`, () => {
			const hits = files
				.filter((f) => pattern.test(readFileSync(f, 'utf-8')))
				.map((f) => f.replace(SRC, 'src'));
			expect(hits, hits.join('\n')).toEqual([]);
		});
	}
});

describe('GO2-W5 INTERLOCKING — signal-systems art direction', () => {
	const separator = readFileSync(
		resolve(SRC, 'lib/components/ui/separator/separator.svelte'),
		'utf-8',
	);
	const card = readFileSync(resolve(SRC, 'lib/components/ui/card/card.svelte'), 'utf-8');
	const terminalChrome = readFileSync(
		resolve(SRC, 'lib/components/brand/TerminalChrome.svelte'),
		'utf-8',
	);
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
		expect(terminalChrome).toContain('background: var(--terminal-chrome);');
		expect(terminalChrome).toContain('background: var(--terminal);');
		// Taste round 2: terminal identity = chrome/border/type — the chassis
		// is the solid-orange structural rule, not a neutral strong border.
		// Round 3: chassis one step thicker (2px).
		expect(terminalChrome).toContain('border: 2px solid var(--border-rule);');
	});

	it('terminal footer values speak the wayfinding voice (departure board)', () => {
		expect(terminalChrome).toContain('text-[var(--accent-text)]');
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
		resolve(SRC, 'lib/components/ui/separator/separator.svelte'),
		'utf-8',
	);
	const card = readFileSync(resolve(SRC, 'lib/components/ui/card/card.svelte'), 'utf-8');
	const shell = readFileSync(
		resolve(SRC, 'lib/components/brand/BlueprintShell.svelte'),
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
		for (const f of [
			'lib/components/home/HomeServices.svelte',
			'lib/components/home/FeaturedProjects.svelte',
		]) {
			expect(readFileSync(resolve(SRC, f), 'utf-8'), f).toContain(
				'border: 2px solid var(--border-brand);',
			);
		}
	});

	it('blueprint shells run the round-3 light visibility (hero 0.46 / details 0.42 / 55% / 70%)', () => {
		expect(shell).toContain('opacity: 0.46;');
		expect(shell).toContain('opacity: 0.42 !important;');
		expect(shell).toContain('color-mix(in srgb, var(--primary) 55%, transparent)');
		expect(shell).toContain('color-mix(in srgb, var(--primary) 70%, transparent)');
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
		expect(read('lib/components/home/FeaturedProjects.svelte')).toMatch(
			/\.proof-marker \{[\s\S]*?color: var\(--accent-text\);/,
		);
		// Listing-header sublines are overlines too.
		expect(read('lib/components/blog/BlogListingPage.svelte')).toMatch(
			/\.blog-header-subtitle \{[\s\S]*?color: var\(--accent-text\);/,
		);
		expect(read('lib/components/projects/ProjectListingPage.svelte')).toMatch(
			/\.projects-header-subtitle \{[\s\S]*?color: var\(--accent-text\);/,
		);
	});

	it('YELLOW role — metric/number callouts speak accent-text everywhere', () => {
		expect(read('lib/components/brand/MetricDisplay.svelte')).toContain('text-accent-text');
		expect(read('lib/components/home/HomeServices.svelte')).toMatch(
			/\.services-metric-value \{[\s\S]*?color: var\(--accent-text\);/,
		);
		expect(read('lib/components/home/FeaturedProjects.svelte')).toMatch(
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
			/<time[^>]*text-\[var\(--accent-text\)\]/,
		);
	});

	it('WHITE role — reflective voice: proof titles over photo gradients + métro dot cores', () => {
		expect(read('lib/components/home/FeaturedProjects.svelte')).toMatch(
			/\.proof-title \{[\s\S]*?color: var\(--reflective\);/,
		);
		expect(read('lib/components/home/DataFlowDiagram.svelte')).toContain('fill="var(--reflective)"');
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
		// Blog prose content block: 1px → 2px.
		expect(read('lib/components/blog/BlogContent.svelte')).toContain('border-2 border-[var(--border-subtle)]');
	});
});

describe('GO-W2.2 T7 — art direction', () => {
	const closer = readFileSync(resolve(SRC, 'lib/components/home/HomeCloser.svelte'), 'utf-8');
	const error = readFileSync(resolve(SRC, 'lib/components/home/ErrorIllustration.svelte'), 'utf-8');
	const metro = readFileSync(resolve(SRC, 'lib/motion/svg/MetroNetwork.svelte'), 'utf-8');

	it('home closer follows the active theme (go2/w4: theme-dark pin removed)', () => {
		// Operator QA: the pinned-dark wrapper read as an "extra layer" on the
		// closer terminal and kept it dark in light mode. The closer now follows
		// the active theme — terminals are a single clean themed surface.
		// (Class attributes only — comments may reference the removed pin.)
		expect(closer).not.toMatch(/class="[^"]*theme-dark[^"]*"/);
		expect(closer).toContain('background: var(--background);');
	});

	it('404 illustration has no white-alpha hardcodes', () => {
		expect(error).not.toContain('rgba(255,255,255');
	});

	it('metro network ships light-theme attribute overrides', () => {
		expect(metro).toContain('[data-theme="light"]');
		expect(metro).toContain('fill: var(--muted);');
	});
});
