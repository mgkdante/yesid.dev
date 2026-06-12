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
