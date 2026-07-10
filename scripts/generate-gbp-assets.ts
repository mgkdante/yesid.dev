#!/usr/bin/env bun
/**
 * Google Business Profile brand-asset generator (yesid.dev), EN + FR.
 *
 * Renders the GBP image set in light + dark, English + French, from the
 * canonical brand system: the wordmark of record (apps/cms/brand/
 * yesid-wordmark.svg), the Montréal métro AZUR blueprint, the four-color
 * doctrine, the famous blueprint grid, and the vendored OG TTFs (Inter
 * 500/900, JetBrains Mono 500). Same stack as apps/web/scripts/
 * generate-og-cards.ts: hand-built SVG -> @resvg/resvg-js. All FR strings are
 * the site's canonical copy (INFRASTRUCTURE NUMÉRIQUE, the four service names,
 * "Une infrastructure numérique qui bouge.").
 *
 * Design decisions (from an adversarial 3-lens verify pass):
 *  - blueprint lifted with fill="none" so it renders as faint LINE-ART on any
 *    ground (a naive lift defaults unspecified fills to black -> grey slabs on
 *    the light paper);
 *  - orange is theme-aware, matching the site --primary token exactly
 *    (#E07800 dark / #A05500 light) on every orange element, not just text;
 *  - service list is a métro line: yellow route + white-core station stops +
 *    orange station numbers, so yellow does real wayfinding;
 *  - the grid rides the storefront cover + OG only (logo/dot stay clean).
 *
 * Usage (from repo root):
 *   bun scripts/generate-gbp-assets.ts
 * Writes into ./gbp-assets/<locale>/ (en, fr):
 *   cover-services.{dark,light}.png   1200x675  -> GBP "cover" (the storefront)
 *   logo-wordmark.{dark,light}.png    1080x1080 -> GBP "logo" (square)
 *   mark-dot.{dark,light}.png         1080x1080 -> avatar, TRANSPARENT ground
 *   og-default.{dark,light}.png       1200x630  -> general OG / social share
 *
 * GBP shows the profile on a WHITE UI, so the LIGHT variants are the safer
 * default for the logo. Not committed by default — regenerate anytime; delete
 * ./gbp-assets/ freely.
 */
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const REPO = resolve(import.meta.dir, '..');
const WEB = `${REPO}/apps/web`;
const OUT = `${REPO}/gbp-assets`;
const require = createRequire(`${WEB}/package.json`);
const { Resvg } = require('@resvg/resvg-js') as typeof import('@resvg/resvg-js');
const FONT_FILES = [
	`${WEB}/src/lib/og/fonts/Inter-Black.ttf`,
	`${WEB}/src/lib/og/fonts/Inter-Medium.ttf`,
	`${WEB}/src/lib/og/fonts/JetBrainsMono-Medium.ttf`,
];
const YELLOW = '#FFB627';
// Every DOT is the vivid brand orange on BOTH themes (operator: the dots must
// read orange, not the muted light-theme #A05500). Body text/grid/crosshairs
// stay theme-aware via t.orange for legibility on the light paper; only the
// brand dots and the mark pin to this.
const DOT = '#E07800';

interface Theme { key: string; bg: string; fg: string; muted: string; orange: string; core: string; blueprint: number; chrome: number; }
const DARK: Theme = { key: 'dark', bg: '#141414', fg: '#F5F5F0', muted: '#949494', orange: '#E07800', core: '#F5F5F0', blueprint: 0.18, chrome: 0.42 };
const LIGHT: Theme = { key: 'light', bg: '#F3F6FB', fg: '#131923', muted: '#545E75', orange: '#A05500', core: '#F9FAFD', blueprint: 0.26, chrome: 0.6 };

interface Locale { key: string; eyebrow: string; schedule: string; nameSize: number; services: Array<[string, string]>; ogTitle: [string, string]; }
const LOCALES: Locale[] = [
	{
		key: 'en', eyebrow: 'DIGITAL INFRASTRUCTURE', schedule: 'SEC-04 · SCHEDULE OF SERVICES', nameSize: 41,
		services: [['01', 'Databases & SQL'], ['02', 'Pipelines & Automation'], ['03', 'Dashboards & Analytics'], ['04', 'Websites & E-commerce']],
		ogTitle: ['Digital infrastructure', 'that moves.'],
	},
	{
		key: 'fr', eyebrow: 'INFRASTRUCTURE NUMÉRIQUE', schedule: 'SEC-04 · HORAIRE DES SERVICES', nameSize: 37,
		services: [['01', 'Bases de données & SQL'], ['02', 'Pipelines & Automatisation'], ['03', 'Tableaux de bord & Analytique'], ['04', 'Sites web & Commerce en ligne']],
		ogTitle: ['Une infrastructure', 'numérique qui bouge.'],
	},
];

const esc = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

// Wordmark of record; the dot is the vivid brand orange on both themes.
const wmSvg = readFileSync(`${REPO}/apps/cms/brand/yesid-wordmark.svg`, 'utf8');
const wmM = [...wmSvg.matchAll(/<path class="(wordmark|dot)" d="([^"]+)"/g)];
const lettersPath = wmM.find(([, c]) => c === 'wordmark')![2];
const dotPath = wmM.find(([, c]) => c === 'dot')![2];
const wordmark = (x: number, y: number, s: number, t: Theme) =>
	`<g transform="translate(${x},${y}) scale(${s})"><path d="${lettersPath}" fill="${t.fg}"/><path d="${dotPath}" fill="${DOT}"/></g>`;

// Blueprint loader — wrap group with fill="none" so unspecified-fill shapes
// render as line-art (not default-black) on any ground.
function blueprint(rel: string, x: number, y: number, targetW: number, t: Theme): string {
	const raw = readFileSync(`${WEB}/${rel}`, 'utf8');
	const open = raw.match(/<svg[^>]*viewBox="([^"]+)"[^>]*>/)![1].split(/\s+/).map(Number);
	const start = raw.indexOf('>', raw.indexOf('<svg')) + 1;
	const inner = raw.slice(start, raw.lastIndexOf('</svg>')).replaceAll('currentColor', t.orange);
	const s = targetW / open[2];
	return `<g transform="translate(${x},${y}) scale(${s})" fill="none" opacity="${t.blueprint}">${inner}</g>`;
}
const AZUR = 'src/lib/components/svg/azur/BlueprintAzurSide.svelte';

function crosshairs(w: number, h: number, t: Theme): string {
	const o = t.chrome, I = 46;
	const ch = (cx: number, cy: number) =>
		`<line x1="${cx - 15}" y1="${cy}" x2="${cx + 15}" y2="${cy}" stroke="${t.orange}" stroke-width="1" opacity="${o}"/><line x1="${cx}" y1="${cy - 15}" x2="${cx}" y2="${cy + 15}" stroke="${t.orange}" stroke-width="1" opacity="${o}"/>`;
	return [ch(I, I), ch(w - I, I), ch(I, h - I), ch(w - I, h - I)].join('');
}

// The famous blueprint grid (minor 40px / major 200px), faint + theme-keyed.
function grid(w: number, h: number, t: Theme): string {
	const mnr = t.key === 'dark' ? 0.05 : 0.07, mjr = t.key === 'dark' ? 0.08 : 0.12;
	const L: string[] = [];
	for (let x = 40; x < w; x += 40) L.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${t.orange}" stroke-width="1" opacity="${x % 200 === 0 ? mjr : mnr}"/>`);
	for (let y = 40; y < h; y += 40) L.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${t.orange}" stroke-width="1" opacity="${y % 200 === 0 ? mjr : mnr}"/>`);
	return L.join('');
}

const W = 1200, H = 675, SM = 96;

// --- Storefront cover: métro schedule of services ---
function cover(t: Theme, loc: Locale): string {
	const startY = 322, gap = 76, lineX = SM + 8;
	const dotCy = (i: number) => startY + i * gap - 13;
	const rows = loc.services.map(([n, name], i) => {
		const y = startY + i * gap, cy = dotCy(i);
		return `<circle cx="${lineX}" cy="${cy}" r="9" fill="${DOT}"/><circle cx="${lineX}" cy="${cy}" r="4" fill="${t.core}"/>
			<text x="${SM + 34}" y="${y}" font-family="JetBrains Mono" font-weight="500" font-size="26" fill="${t.orange}">${n}</text>
			<text x="${SM + 92}" y="${y}" font-family="Inter" font-weight="900" font-size="${loc.nameSize}" letter-spacing="-1" fill="${t.fg}">${esc(name)}</text>`;
	}).join('\n');
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
		<rect width="${W}" height="${H}" fill="${t.bg}"/>
		${grid(W, H, t)}
		${blueprint(AZUR, 316, 306, 1240, t)}
		${crosshairs(W, H, t)}
		${wordmark(SM, 74, 1.5, t)}
		<text x="${SM + 2}" y="212" font-family="JetBrains Mono" font-weight="500" font-size="21" letter-spacing="2.4" fill="${t.orange}">${loc.eyebrow}</text>
		<rect x="${SM}" y="230" width="128" height="6" fill="${YELLOW}"/>
		<line x1="${lineX}" y1="${dotCy(0)}" x2="${lineX}" y2="${dotCy(3)}" stroke="${YELLOW}" stroke-width="3"/>
		${rows}
		<text x="${SM}" y="${H - 46}" font-family="JetBrains Mono" font-weight="500" font-size="19" letter-spacing="2" fill="${t.orange}" opacity="${t.chrome + 0.15}">${loc.schedule}</text>
		<text x="${W - SM}" y="${H - 46}" font-family="JetBrains Mono" font-weight="500" font-size="21" letter-spacing="2.2" fill="${t.muted}" text-anchor="end">yesid.dev</text>
	</svg>`;
}

function logoWordmark(t: Theme, loc: Locale): string {
	const scale = 760 / 130, w = 130 * scale, h = 64 * scale, x = (1080 - w) / 2, y = (1080 - h) / 2;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
		<rect width="1080" height="1080" fill="${t.bg}"/>
		${crosshairs(1080, 1080, t)}
		${wordmark(x, y, scale, t)}
		<text x="540" y="${y + h + 92}" font-family="JetBrains Mono" font-weight="500" font-size="29" letter-spacing="3" fill="${t.muted}" text-anchor="middle">${loc.eyebrow}</text>
	</svg>`;
}

// The bare mark: dot + outer ring on a TRANSPARENT ground, nothing else. No
// background rect, so the same file drops onto any surface (GBP's white UI, a
// dark deck, an email signature) without carrying a square of #141414 with it.
// Resvg renders unpainted pixels as alpha 0 by default.
//
// Ring weight is sized for the DISPLAY size, not the source size. The old 3px
// hairline at 0.3 opacity only read at full 1080; GBP crops avatars to roughly
// 250px, where 3px becomes 0.69px of 30%-alpha ink and the ring disappears,
// leaving a plain dot. At stroke 8 / 0.55 the ring still lands 1.85px at 250px
// and survives the downscale while keeping the airy hairline character.
function markDot(t: Theme): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
		<circle cx="540" cy="540" r="362" fill="none" stroke="${DOT}" stroke-width="8" opacity="0.55"/>
		<circle cx="540" cy="540" r="300" fill="${DOT}"/>
	</svg>`;
}

function ogDefault(t: Theme, loc: Locale): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
		<rect width="1200" height="630" fill="${t.bg}"/>
		${grid(1200, 630, t)}
		${blueprint(AZUR, 300, 250, 1150, t)}
		${crosshairs(1200, 630, t)}
		<text x="98" y="104" font-family="JetBrains Mono" font-weight="500" font-size="21" letter-spacing="2.4" fill="${t.orange}">${loc.eyebrow}</text>
		<rect x="96" y="150" width="128" height="6" fill="${YELLOW}"/>
		<text x="96" y="266" font-family="Inter" font-weight="900" font-size="82" letter-spacing="-1.5" fill="${t.fg}">${esc(loc.ogTitle[0])}</text>
		<text x="96" y="358" font-family="Inter" font-weight="900" font-size="82" letter-spacing="-1.5" fill="${t.fg}">${esc(loc.ogTitle[1])}</text>
		${wordmark(96, 470, 0.82, t)}
		<text x="1104" y="512" font-family="JetBrains Mono" font-weight="500" font-size="20" letter-spacing="2.2" fill="${t.muted}" text-anchor="end">yesid.dev</text>
	</svg>`;
}

const jobs: Array<[string, number, string]> = [];
for (const loc of LOCALES) {
	for (const t of [DARK, LIGHT]) {
		jobs.push([`${loc.key}/cover-services.${t.key}.png`, W, cover(t, loc)]);
		jobs.push([`${loc.key}/logo-wordmark.${t.key}.png`, 1080, logoWordmark(t, loc)]);
		jobs.push([`${loc.key}/mark-dot.${t.key}.png`, 1080, markDot(t)]);
		jobs.push([`${loc.key}/og-default.${t.key}.png`, 1200, ogDefault(t, loc)]);
	}
}
mkdirSync(OUT, { recursive: true });
for (const [file, width, svg] of jobs) {
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Inter' } }).render().asPng();
	const target = resolve(OUT, file);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, png);
	console.log(`✓ ${file}  ${(png.byteLength / 1024).toFixed(0)}KB`);
}
console.log(`\nWrote ${jobs.length} files to ${OUT}/{en,fr}`);

// The Organization.logo of record. Unlike ./gbp-assets (throwaway, regenerate
// anytime), this is a COMMITTED web asset: schema.org Organization.logo points
// at it, so Google's entity surfaces and the site ship the same mark from the
// same markDot() geometry. Dark orange, because Google presents the logo on a
// purely white ground and dark is the brand default. 512px clears Google's
// 112x112 minimum with room to downscale.
const WEB_MARK = `${WEB}/static/brand/mark-512.png`;
mkdirSync(dirname(WEB_MARK), { recursive: true });
const markPng = new Resvg(markDot(DARK), { fitTo: { mode: 'width', value: 512 } }).render().asPng();
writeFileSync(WEB_MARK, markPng);
console.log(`✓ apps/web/static/brand/mark-512.png  ${(markPng.byteLength / 1024).toFixed(0)}KB  (Organization.logo)`);
