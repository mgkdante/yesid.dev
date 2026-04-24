#!/usr/bin/env bun
// Generates static/og/default.{locale}.png — one 1200×630 branded OG image
// per locale in PUBLISHED_LOCALES that has a tagline translation in siteMeta.
//
//   bun run og:default
//
// Data flow: siteMeta (data layer) → LocalizedString fields → SVG string →
// sharp → PNG. Single source of truth; when Yesid signs off on a FR/ES
// tagline, add it to siteMeta, add the locale to PUBLISHED_LOCALES, rerun.
//
// Slice 15c (post-CMS-migration) will generalise this into a per-post /
// per-project Satori pipeline. Until then, this one image per locale is the
// default fallback for every route that doesn't specify its own ogImage.

import sharp from 'sharp';
import { siteMeta } from '../src/lib/content/meta';
import { PUBLISHED_LOCALES } from '../src/lib/utils/seo-defaults';
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
	const outPath = `static/og/default.${locale}.png`;
	const result = await sharp(Buffer.from(svg))
		.resize(1200, 630)
		.png({ compressionLevel: 9 })
		.toFile(outPath);

	console.log(`[og-default] wrote ${outPath} — ${result.width}×${result.height}, ${result.size} bytes`);
	return { wrote: true };
}

async function main() {
	let wroteCount = 0;
	for (const locale of PUBLISHED_LOCALES) {
		const { wrote, reason } = await generateForLocale(locale);
		if (wrote) wroteCount++;
		else console.log(`[og-default] skip ${locale}: ${reason}`);
	}
	if (wroteCount === 0) {
		console.error('[og-default] no OG images generated — check siteMeta.tagline has at least one published-locale entry');
		process.exit(1);
	}
	console.log(`[og-default] generated ${wroteCount} image(s) for locales: ${PUBLISHED_LOCALES.join(', ')}`);
}

main().catch((err) => {
	console.error('[og-default] fatal:', err);
	process.exit(1);
});
