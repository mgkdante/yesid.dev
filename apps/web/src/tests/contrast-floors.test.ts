// GO-W2.2 T4: brand-alpha TEXT floors. color: declarations mixing primary/
// accent/blog-accent below 85% (or foreground below 65%) fail AA on our
// surfaces. Backgrounds/borders may mix lower — only `color:` lines are scanned.
//
// Exemption: aria-hidden ornaments (watermarks, edge rails, decoration ticks)
// are WCAG 1.4.3 "pure decoration" — mark the line (or a line within 3 above)
// with `contrast-exempt: decorative` and it is skipped. Use sparingly; every
// marker must sit on an aria-hidden element.
//
// PARITY FLIP (2026-07-03): the two BRAND contrast engines are re-seated on
// @yesid/gates + presets/yesid, byte-equivalent to yesid.dev @ 2bdb611d:
//   - colorMixViolations: same 85/65 floors, same 3-line exempt window, same
//     primary|accent|blog-accent token set, same `L{n}: {line}` hit format.
//   - runContrastPairs / runIdentities: same WCAG relative-luminance math over
//     the same 57 AA pairs (YESID_AA_PAIRS) + 2 terminal identities.
// The app-specific ART-DIRECTION asserts (StationTabs floor, AboutMethod,
// accent-never-as-text, stale-marker guard) stay LOCAL — per-app taste, not
// brand gates.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { colorMixViolations, runContrastPairs, runIdentities } from '@yesid/gates';
import {
	YESID_COLOR_MIX_FILES,
	YESID_MARKER_ALLOWED_FILES,
	YESID_AA_PAIRS,
	YESID_IDENTITIES,
} from '@yesid/gates/presets/yesid';

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf-8');

describe('contrast floors on color: declarations', () => {
	for (const f of YESID_COLOR_MIX_FILES) {
		it(`${f}: brand mixes >= 85%, foreground mixes >= 65%`, () => {
			const bad = colorMixViolations(read(f));
			expect(bad, bad.join('\n')).toEqual([]);
		});
	}

	// ── app-specific art-direction (stays local) ──
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
		// Markers are only legal in the scanned files; this catches drive-by reuse.
		for (const f of YESID_COLOR_MIX_FILES) {
			const count = (read(f).match(/contrast-exempt/g) ?? []).length;
			if (!YESID_MARKER_ALLOWED_FILES.has(f)) {
				expect(count, `${f} must not carry contrast-exempt markers`).toBe(0);
			}
		}
	});
});

// ──────────────────────────────────────────────────────────────────────
// GO2-W5 INTERLOCKING (taste round 2): token-level AA lock. Computes WCAG
// 2.x relative-luminance ratios straight from packages/tokens/tokens.json so
// any palette drift that breaks a contracted pair fails here, with the actual
// number. The 57 pairs + 2 terminal identities now live in the @yesid/gates
// yesid preset (transcribed verbatim from the anchor).
// ──────────────────────────────────────────────────────────────────────
describe('GO2-W5 — computed AA pairs from tokens.json', () => {
	const tokens = JSON.parse(
		readFileSync(resolve(process.cwd(), '../../packages/tokens/tokens.json'), 'utf-8'),
	);

	for (const { label, ratio, floor, pass } of runContrastPairs(tokens, YESID_AA_PAIRS)) {
		it(`${label} ≥ ${floor}:1`, () => {
			expect(pass, `${label} computed ${ratio.toFixed(2)}:1`).toBe(true);
		});
	}

	// Taste round 2 operator contract: terminals are the SITE background —
	// same solid surface as the page in BOTH modes.
	for (const { label, a, b, pass } of runIdentities(tokens, YESID_IDENTITIES)) {
		it(label, () => {
			expect(pass, `${label}: ${a} vs ${b}`).toBe(true);
		});
	}
});
