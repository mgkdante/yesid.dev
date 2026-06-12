// GO-W2.2 T4: brand-alpha TEXT floors. color: declarations mixing primary/
// accent/blog-accent below 85% (or foreground below 65%) fail AA on our
// surfaces. Backgrounds/borders may mix lower — only `color:` lines are scanned.
//
// Exemption: aria-hidden ornaments (watermarks, edge rails, decoration ticks)
// are WCAG 1.4.3 "pure decoration" — mark the line (or a line within 3 above)
// with `contrast-exempt: decorative` and it is skipped. Use sparingly; every
// marker must sit on an aria-hidden element.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf-8');

const FILES = [
	'src/lib/components/home/Manifesto.svelte',
	'src/lib/components/layout/MenuOverlay.svelte',
	'src/lib/components/home/FeaturedProjects.svelte',
	'src/lib/components/blog/BlogDetailHeader.svelte',
	'src/lib/components/projects/ProjectDetailHeader.svelte',
	'src/lib/components/projects/ProjectTocPill.svelte',
	'src/lib/components/blog/BlogTocPill.svelte',
];

// (?<![-\w]) keeps `border-color:` / `outline-color:` (boundaries, not text)
// out of the scan — only bare `color:` declarations are text.
const COLOR_MIX_TEXT = /(?<![-\w])color:\s*color-mix\(in srgb,\s*var\(--(?:primary|accent|blog-accent)[^)]*\)\s*(\d+(?:\.\d+)?)%/;
const FG_MIX_TEXT = /(?<![-\w])color:\s*color-mix\(in srgb,\s*var\(--foreground\)\s*(\d+(?:\.\d+)?)%/;

function violations(src: string): string[] {
	const lines = src.split('\n');
	const bad: string[] = [];
	lines.forEach((line, i) => {
		const window = lines.slice(Math.max(0, i - 3), i + 1).join('\n');
		if (window.includes('contrast-exempt')) return;
		const brand = line.match(COLOR_MIX_TEXT);
		if (brand && Number(brand[1]) < 85) bad.push(`L${i + 1}: ${line.trim()}`);
		const fg = line.match(FG_MIX_TEXT);
		if (fg && Number(fg[1]) < 65) bad.push(`L${i + 1}: ${line.trim()}`);
	});
	return bad;
}

describe('contrast floors on color: declarations', () => {
	for (const f of FILES) {
		it(`${f}: brand mixes >= 85%, foreground mixes >= 65%`, () => {
			const bad = violations(read(f));
			expect(bad, bad.join('\n')).toEqual([]);
		});
	}

	it('StationTabs inactive opacity floor is 0.8', () => {
		expect(read('src/lib/components/shared/StationTabs.svelte')).toContain('Math.max(0.8,');
	});

	it('AboutMethod step description carries no opacity-60', () => {
		expect(read('src/lib/components/about/AboutMethod.svelte')).not.toContain('opacity-60');
	});

	it('accent is never used as text in light-themed surfaces (accent-text token instead)', () => {
		for (const f of [
			'src/lib/components/home/HeroSqlPanel.svelte',
			'src/lib/components/about/AboutCta.svelte',
			'src/lib/components/about/AboutWeather.svelte',
			'src/lib/components/shared/CollapsibleSection.svelte',
			'src/lib/components/contact/ContactPage.svelte',
			'src/lib/components/blog/BlogRow.svelte',
		]) {
			expect(read(f), f).not.toMatch(/text-\[var\(--accent\)\]|[^-]color:\s*var\(--accent\);/);
		}
	});

	it('every contrast-exempt marker sits in a file that actually needs it (no stale markers)', () => {
		// Markers are only legal in the scanned FILES list; this catches drive-by reuse.
		const allowed = new Set([
			'src/lib/components/projects/ProjectDetailHeader.svelte',
			'src/lib/components/blog/BlogDetailHeader.svelte',
		]);
		for (const f of FILES) {
			const count = (read(f).match(/contrast-exempt/g) ?? []).length;
			if (!allowed.has(f)) {
				expect(count, `${f} must not carry contrast-exempt markers`).toBe(0);
			}
		}
	});
});

// ──────────────────────────────────────────────────────────────────────
// GO2-W5 INTERLOCKING (taste round 2): token-level AA lock. Computes WCAG
// 2.x relative-luminance ratios straight from packages/tokens/tokens.json so
// any palette drift that breaks a contracted pair fails here, with the
// actual number. Round 2 recomputed every pair against the restored
// near-black dark board + page-colored terminals, and grew 48 → 50 pairs
// (D primary/background rule voice; L border-strong/card structure floor).
// Round 4 (four-color doctrine) grows 50 → 57: accent-text wayfinding pairs
// on background/manifesto (overlines, markers, metric callouts, readouts),
// the WHITE reflective voice on the signage/hazard black family, and the
// light BLACK structural border (#1C1814 family) on paper.
// ──────────────────────────────────────────────────────────────────────
describe('GO2-W5 — computed AA pairs from tokens.json', () => {
	const tokens = JSON.parse(
		readFileSync(resolve(process.cwd(), '../../packages/tokens/tokens.json'), 'utf-8'),
	);
	const hex = (mode: 'dark' | 'light' | 'brand', name: string): string => {
		const v = tokens.color[mode]?.[name]?.$value;
		if (typeof v !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(v)) {
			throw new Error(`token color.${mode}.${name} is not a hex color: ${v}`);
		}
		return v;
	};

	function luminance(h: string): number {
		const [r, g, b] = [1, 3, 5]
			.map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
			.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	}
	function ratio(a: string, b: string): number {
		const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
		return (hi + 0.05) / (lo + 0.05);
	}

	// [description, fg token ref, bg token ref, floor]
	type Mode = 'dark' | 'light' | 'brand';
	const PAIRS: Array<[string, [Mode, string], [Mode, string], number]> = [
		// dark text pairs (AA 4.5)
		['D foreground/background', ['dark', 'foreground'], ['dark', 'background'], 4.5],
		['D foreground/card', ['dark', 'foreground'], ['dark', 'card'], 4.5],
		['D muted-foreground/popover (worst case)', ['dark', 'muted-foreground'], ['dark', 'popover'], 4.5],
		['D secondary-foreground/card', ['dark', 'secondary-foreground'], ['dark', 'card'], 4.5],
		['D secondary-foreground/terminal-chrome', ['dark', 'secondary-foreground'], ['dark', 'terminal-chrome'], 4.5],
		['D primary/popover (worst case)', ['dark', 'primary'], ['dark', 'popover'], 4.5],
		['D primary/card', ['dark', 'primary'], ['dark', 'card'], 4.5],
		['D primary/background (border-rule voice)', ['dark', 'primary'], ['dark', 'background'], 4.5],
		['D background-as-primary-foreground/primary', ['dark', 'background'], ['dark', 'primary'], 4.5],
		['D accent-text/card', ['dark', 'accent-text'], ['dark', 'card'], 4.5],
		['D accent-text/accent-surface', ['dark', 'accent-text'], ['dark', 'accent-surface'], 4.5],
		['D primary/accent-surface', ['dark', 'primary'], ['dark', 'accent-surface'], 4.5],
		['D accent-foreground/accent', ['dark', 'accent-foreground'], ['brand', 'accent'], 4.5],
		['D destructive-foreground/destructive', ['dark', 'destructive-foreground'], ['dark', 'destructive'], 4.5],
		['D destructive/card', ['dark', 'destructive'], ['dark', 'card'], 4.5],
		['D success/card', ['dark', 'success'], ['dark', 'card'], 4.5],
		['D terminal-ink/terminal', ['dark', 'terminal-ink'], ['dark', 'terminal'], 4.5],
		['D terminal-ink-muted/terminal', ['dark', 'terminal-ink-muted'], ['dark', 'terminal'], 4.5],
		['D terminal-ink-muted/terminal-chrome', ['dark', 'terminal-ink-muted'], ['dark', 'terminal-chrome'], 4.5],
		// dark UI/graphics (3:1)
		['D input/card (1.4.11)', ['dark', 'input'], ['dark', 'card'], 3],
		['D line-amber/background (graphics)', ['dark', 'line-amber'], ['dark', 'background'], 3],
		['D signal-lunar/card (graphics)', ['dark', 'signal-lunar'], ['dark', 'card'], 3],
		// light text pairs (AA 4.5)
		['L foreground/background', ['light', 'foreground'], ['light', 'background'], 4.5],
		['L foreground/card', ['light', 'foreground'], ['light', 'card'], 4.5],
		['L muted-foreground/muted (worst case)', ['light', 'muted-foreground'], ['light', 'muted'], 4.5],
		['L muted-foreground/background', ['light', 'muted-foreground'], ['light', 'background'], 4.5],
		['L secondary-foreground/terminal-chrome', ['light', 'secondary-foreground'], ['light', 'terminal-chrome'], 4.5],
		['L primary/muted (worst case)', ['light', 'primary'], ['light', 'muted'], 4.5],
		['L primary/background', ['light', 'primary'], ['light', 'background'], 4.5],
		['L primary/terminal', ['light', 'primary'], ['light', 'terminal'], 4.5],
		['L background-as-primary-foreground/primary', ['light', 'background'], ['light', 'primary'], 4.5],
		['L primary-hover/background', ['light', 'primary-hover'], ['light', 'background'], 4.5],
		['L accent-text/terminal-chrome (worst case)', ['light', 'accent-text'], ['light', 'terminal-chrome'], 4.5],
		['L accent-text/muted', ['light', 'accent-text'], ['light', 'muted'], 4.5],
		['L accent-text/accent-surface', ['light', 'accent-text'], ['light', 'accent-surface'], 4.5],
		['L primary/accent-surface', ['light', 'primary'], ['light', 'accent-surface'], 4.5],
		['L accent-foreground/accent', ['light', 'accent-foreground'], ['brand', 'accent'], 4.5],
		['L destructive-foreground/destructive', ['light', 'destructive-foreground'], ['light', 'destructive'], 4.5],
		['L destructive/muted (worst case)', ['light', 'destructive'], ['light', 'muted'], 4.5],
		['L success/muted (worst case)', ['light', 'success'], ['light', 'muted'], 4.5],
		['L terminal-ink/terminal', ['light', 'terminal-ink'], ['light', 'terminal'], 4.5],
		['L terminal-ink-muted/terminal', ['light', 'terminal-ink-muted'], ['light', 'terminal'], 4.5],
		['L terminal-ink-muted/terminal-chrome', ['light', 'terminal-ink-muted'], ['light', 'terminal-chrome'], 4.5],
		// light UI/graphics (3:1)
		['L input/background (1.4.11)', ['light', 'input'], ['light', 'background'], 3],
		['L line-amber/background (graphics)', ['light', 'line-amber'], ['light', 'background'], 3],
		['L line-amber/card (graphics)', ['light', 'line-amber'], ['light', 'card'], 3],
		['L signal-lunar/muted (graphics)', ['light', 'signal-lunar'], ['light', 'muted'], 3],
		['L border-strong/card (round-2 hard structure)', ['light', 'border-strong'], ['light', 'card'], 3],
		// theme-invariant signal systems
		['hazard stripe pair (tape)', ['brand', 'hazard-a'], ['brand', 'hazard-b'], 3],
		['signage chip (both modes)', ['brand', 'signage-text'], ['brand', 'signage-bg'], 4.5],
		// round 4 — four-color doctrine pairs
		['D accent-text/background (wayfinding overlines/markers/readouts)', ['dark', 'accent-text'], ['dark', 'background'], 4.5],
		['D accent-text/manifesto (arrival board)', ['dark', 'accent-text'], ['dark', 'manifesto'], 4.5],
		['L accent-text/background (wayfinding overlines/markers/readouts)', ['light', 'accent-text'], ['light', 'background'], 4.5],
		['L accent-text/card (metric callouts on cards)', ['light', 'accent-text'], ['light', 'card'], 4.5],
		['L accent-text/manifesto (arrival board)', ['light', 'accent-text'], ['light', 'manifesto'], 4.5],
		['reflective/signage-bg (white voice on the black family)', ['brand', 'reflective'], ['brand', 'signage-bg'], 4.5],
		['L border-strong/background (black tape structure, graphics)', ['light', 'border-strong'], ['light', 'background'], 3],
	];

	for (const [name, fg, bg, floor] of PAIRS) {
		it(`${name} ≥ ${floor}:1`, () => {
			const r = ratio(hex(fg[0], fg[1]), hex(bg[0], bg[1]));
			expect(r, `${name} computed ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(floor);
		});
	}

	// Taste round 2 operator contract: terminals are the SITE background —
	// same solid surface as the page in BOTH modes. The terminal identity
	// lives in chrome/border/type, never in a special surface color.
	it('terminal IS the site background (dark)', () => {
		expect(hex('dark', 'terminal')).toBe(hex('dark', 'background'));
	});
	it('terminal IS the site background (light)', () => {
		expect(hex('light', 'terminal')).toBe(hex('light', 'background'));
	});
});
