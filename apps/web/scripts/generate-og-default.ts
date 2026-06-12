#!/usr/bin/env bun
// Generates static/og/default.{locale}.png — one 1200×630 branded OG image
// per locale. Restored from a5f28f2^ at slice-28.6 (deleted in slice-27.1)
// and adapted:
//   - sharp → @resvg/resvg-js (sharp was dropped from deps; resvg is already
//     vendored for the runtime OG pipeline — no new deps).
//   - siteMeta import path: ../src/lib/content/meta (deleted in 18h) →
//     ../src/lib/content/site-meta.
//   - `--locale=fr` CLI override so the FR asset can be minted BEFORE the
//     PUBLISHED_LOCALES flip (runbook order: content drop → og asset → flip).
//     Default remains every PUBLISHED_LOCALE.
//   - fonts: vendored TTFs under src/lib/og/fonts/ are passed to resvg so the
//     output doesn't depend on system fonts.
//
// ⚠️ RENDERER DRIFT: the committed static/og/default.en.png was produced by
// the original sharp pipeline; this resvg port does NOT reproduce it
// byte-identically (different rasterizer). The committed EN asset stays
// canonical — do NOT regenerate + commit EN unless the design changes.
// This script exists to mint NEW locale assets (default.fr.png at the FR
// content drop, once siteMeta.tagline.fr lands).
//
//   bun scripts/generate-og-default.ts             # every published locale
//   bun scripts/generate-og-default.ts --locale=fr # one locale, pre-flip
//
// Data flow: siteMeta (data layer) → LocalizedString fields → SVG string →
// resvg → PNG. Single source of truth; when Yesid signs off on a FR/ES
// tagline, add it to siteMeta (CMS → export-fallbacks), rerun with --locale.

import { parseArgs } from 'node:util';
import { resolve as resolvePath } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { siteMeta } from '../src/lib/content/site-meta';
import { PUBLISHED_LOCALES } from '../src/lib/utils/seo-defaults';
import { SUPPORTED_LOCALES } from '../src/lib/utils/locale';
import type { Locale, LocalizedString } from '../src/lib/types';

// Locale-specific eyebrow copy. Kept in-script because it's chrome for the
// OG template, not content the content layer knows about.
const EYEBROW: Record<Locale, string> = {
	en: 'Digital Infrastructure · Montréal',
	fr: 'Infrastructure numérique · Montréal',
	es: 'Infraestructura digital · Montréal',
};

// Footer location chip. Same in every locale — "Montréal" is the official city name.
const FOOTER_LOCATION = 'Montréal · QC';

// Vendored TTFs (same files the runtime OG pipeline inlines via Vite).
const FONT_FILES = [
	'src/lib/og/fonts/Inter-Medium.ttf',
	'src/lib/og/fonts/Inter-Black.ttf',
	'src/lib/og/fonts/JetBrainsMono-Medium.ttf',
].map((p) => resolvePath(import.meta.dir, '..', p));

function xmlEscape(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function resolve(field: LocalizedString, locale: Locale): string | null {
	const v = field[locale];
	return v && v.trim() !== '' ? v : null;
}

function buildSvg(locale: Locale, tagline: string): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>
      .wordmark { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-weight: 900; font-size: 180px; letter-spacing: -0.04em; }
      .tagline { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-weight: 500; font-size: 40px; letter-spacing: -0.01em; }
      .eyebrow { font-family: 'JetBrains Mono', 'Courier New', monospace; font-weight: 500; font-size: 18px; letter-spacing: 0.12em; text-transform: uppercase; }
    </style>
  </defs>

  <rect width="1200" height="630" fill="#141414"/>

  <g opacity="0.06" stroke="#F5F5F5" stroke-width="1" fill="none">
    <line x1="1000" y1="60" x2="1160" y2="60"/>
    <line x1="1120" y1="30" x2="1120" y2="100"/>
    <circle cx="1120" cy="60" r="4" fill="#F5F5F5"/>
    <line x1="1050" y1="110" x2="1160" y2="110"/>
    <circle cx="1080" cy="110" r="3" fill="#F5F5F5"/>
    <line x1="1080" y1="110" x2="1080" y2="150"/>
    <circle cx="1080" cy="150" r="3" fill="#F5F5F5"/>
  </g>

  <text x="80" y="80" class="eyebrow" fill="#E07800">${xmlEscape(EYEBROW[locale])}</text>

  <text x="80" y="340" class="wordmark" fill="#F5F5F5">${xmlEscape(siteMeta.name.replace('.', ''))}<tspan fill="#E07800">.</tspan></text>

  <text x="80" y="420" class="tagline" fill="#9CA3AF">${xmlEscape(tagline)}</text>

  <text x="80" y="560" class="eyebrow" fill="#9CA3AF">yesid.dev</text>
  <text x="1120" y="560" class="eyebrow" fill="#9CA3AF" text-anchor="end">${xmlEscape(FOOTER_LOCATION)}</text>

  <rect x="80" y="585" width="120" height="3" fill="#E07800"/>
</svg>`;
}

async function generateForLocale(locale: Locale): Promise<{ wrote: boolean; reason?: string }> {
	const tagline = resolve(siteMeta.tagline, locale);
	if (!tagline) {
		return {
			wrote: false,
			reason: `no tagline translation in siteMeta.tagline.${locale}`,
		};
	}

	const svg = buildSvg(locale, tagline);
	const outPath = resolvePath(import.meta.dir, '..', `static/og/default.${locale}.png`);
	const resvg = new Resvg(svg, {
		fitTo: { mode: 'width', value: 1200 },
		font: { fontFiles: FONT_FILES, loadSystemFonts: false },
	});
	const png = resvg.render().asPng();
	await Bun.write(outPath, png);

	console.log(`[og-default] wrote ${outPath} — 1200×630, ${png.byteLength} bytes`);
	return { wrote: true };
}

async function main() {
	const { values } = parseArgs({ options: { locale: { type: 'string' } } });
	let locales: readonly Locale[];
	if (values.locale) {
		if (!(SUPPORTED_LOCALES as readonly string[]).includes(values.locale)) {
			console.error(`[og-default] unsupported locale: ${values.locale}`);
			process.exit(1);
		}
		locales = [values.locale as Locale];
	} else {
		locales = PUBLISHED_LOCALES;
	}

	let wroteCount = 0;
	for (const locale of locales) {
		const { wrote, reason } = await generateForLocale(locale);
		if (wrote) wroteCount++;
		else console.log(`[og-default] skip ${locale}: ${reason}`);
	}
	if (wroteCount === 0) {
		console.error(
			'[og-default] no OG images generated — check siteMeta.tagline has an entry for the requested locale(s)',
		);
		process.exit(1);
	}
	console.log(`[og-default] generated ${wroteCount} image(s) for locales: ${locales.join(', ')}`);
}

main().catch((err) => {
	console.error('[og-default] fatal:', err);
	process.exit(1);
});
