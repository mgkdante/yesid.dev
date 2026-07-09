#!/usr/bin/env bun
/**
 * OG share-card generator (homework #5, slice brand-svg-og-cards).
 *
 * Mints the static card set: four service cards, the /services, /contact,
 * /about and /projects route cards, home defaults (EN + FR) and the general
 * site card. 1200x630 PNG, hard budget <150KB, text inside 80px margins,
 * bg #141414 / text #F5F5F0 / orange #E07800 / yellow #FFB627.
 *
 * Every card carries the outlined wordmark ("yesid" + orange period as one
 * word) read from apps/cms/brand/yesid-wordmark.svg, the canonical brand
 * asset, so card branding can never drift from the wordmark of record.
 *
 * Same rendering stack as generate-og-default.ts: hand-built SVG -> resvg
 * with the vendored OG TTFs (Inter 500/900, JetBrains Mono 500). The /about
 * card embeds the headshot; sharp (an apps/cms dependency) converts the
 * committed webp to PNG at render time via createRequire.
 *
 *   bun scripts/generate-og-cards.ts                 # writes into static/og
 *   bun scripts/generate-og-cards.ts --out <dir>     # mockup run
 */

import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const WEB_ROOT = resolve(import.meta.dir, '..');
const REPO_ROOT = resolve(WEB_ROOT, '../..');

const OUT_FLAG = process.argv.indexOf('--out');
const OUT_DIR = OUT_FLAG === -1 ? resolve(WEB_ROOT, 'static/og') : resolve(process.argv[OUT_FLAG + 1] ?? '');

const WIDTH = 1200;
const HEIGHT = 630;
const MARGIN = 80;
const BUDGET_BYTES = 150_000;

const BG = '#141414';
const TEXT = '#F5F5F0';
const MUTED = '#9CA3AF';
const ORANGE = '#E07800';
const YELLOW = '#FFB627';

const FONT_FILES = [
	resolve(WEB_ROOT, 'src/lib/og/fonts/Inter-Black.ttf'),
	resolve(WEB_ROOT, 'src/lib/og/fonts/Inter-Medium.ttf'),
	resolve(WEB_ROOT, 'src/lib/og/fonts/JetBrainsMono-Medium.ttf'),
];

// --- Brand wordmark (canonical outlined paths) ---------------------------

const wordmarkSvg = readFileSync(resolve(REPO_ROOT, 'apps/cms/brand/yesid-wordmark.svg'), 'utf8');
const wordmarkPaths = [...wordmarkSvg.matchAll(/<path class="(wordmark|dot)" d="([^"]+)"/g)];
const lettersPath = wordmarkPaths.find(([, cls]) => cls === 'wordmark')?.[2];
const dotPath = wordmarkPaths.find(([, cls]) => cls === 'dot')?.[2];
if (!lettersPath || !dotPath) {
	throw new Error('could not extract wordmark paths from apps/cms/brand/yesid-wordmark.svg');
}

/** The wordmark as a positioned group. Source viewBox is 130x64. */
function wordmark(x: number, y: number, scale: number, letterFill = TEXT): string {
	return `<g transform="translate(${x},${y}) scale(${scale})">
		<path d="${lettersPath}" fill="${letterFill}"/>
		<path d="${dotPath}" fill="${ORANGE}"/>
	</g>`;
}

// --- Art helpers ----------------------------------------------------------

function escapeXml(s: string): string {
	return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/** Inline a service icon (48x48, var(--primary) tokens) recolored for cards. */
function serviceArt(name: string, x: number, y: number, size: number, opacity: number): string {
	const raw = readFileSync(resolve(WEB_ROOT, `static/svg/services/${name}`), 'utf8');
	// Icons carry var(--primary)/var(--accent) plus bare hex-alpha suffixes
	// ("var(--primary)15"); substituting the hex color turns those into valid
	// 8-digit hex, same trick the site's SVG panel uses.
	const inner = raw
		.replace(/^[\s\S]*?<svg[^>]*>/, '')
		.replace(/<\/svg>\s*$/, '')
		.replaceAll('var(--primary)', ORANGE)
		.replaceAll('var(--accent)', YELLOW);
	return `<g transform="translate(${x},${y}) scale(${size / 48})" opacity="${opacity}">${inner}</g>`;
}

/** Inline the digital-infrastructure blueprint (840x520, currentColor). */
function blueprintArt(x: number, y: number, scale: number, opacity: number): string {
	const raw = readFileSync(
		resolve(WEB_ROOT, 'src/lib/assets/project-fallbacks/digital-desktop.svg'),
		'utf8',
	);
	const inner = raw
		.replace(/^[\s\S]*?<svg[^>]*>/, '')
		.replace(/<\/svg>\s*$/, '')
		.replaceAll('currentColor', ORANGE);
	return `<g transform="translate(${x},${y}) scale(${scale})" opacity="${opacity}" fill="none" stroke="${ORANGE}">${inner}</g>`;
}

/** Faint blueprint grid, full bleed (minor 40px / major 200px). */
function grid(): string {
	const lines: string[] = [];
	for (let x = 40; x < WIDTH; x += 40) {
		lines.push(
			`<line x1="${x}" y1="0" x2="${x}" y2="${HEIGHT}" stroke="${ORANGE}" stroke-width="1" opacity="${x % 200 === 0 ? 0.07 : 0.04}"/>`,
		);
	}
	for (let y = 40; y < HEIGHT; y += 40) {
		lines.push(
			`<line x1="0" y1="${y}" x2="${WIDTH}" y2="${y}" stroke="${ORANGE}" stroke-width="1" opacity="${y % 200 === 0 ? 0.07 : 0.04}"/>`,
		);
	}
	return lines.join('');
}

// --- Layout primitives ----------------------------------------------------

function eyebrow(text: string, fill = ORANGE): string {
	return `<text x="${MARGIN}" y="104" font-family="JetBrains Mono" font-weight="500" font-size="22" letter-spacing="2.6" fill="${fill}">${escapeXml(text)}</text>`;
}

function overline(y = 186): string {
	return `<rect x="${MARGIN}" y="${y}" width="140" height="6" fill="${YELLOW}"/>`;
}

function titleBlock(lines: string[], size: number, startY: number, fill = TEXT): string {
	const lineHeight = Math.round(size * 1.12);
	return lines
		.map(
			(line, i) =>
				`<text x="${MARGIN}" y="${startY + i * lineHeight}" font-family="Inter" font-weight="900" font-size="${size}" letter-spacing="-1.5" fill="${fill}">${escapeXml(line)}</text>`,
		)
		.join('');
}

function subtitleBlock(lines: string[], startY: number, size = 40): string {
	const lineHeight = Math.round(size * 1.35);
	return lines
		.map(
			(line, i) =>
				`<text x="${MARGIN}" y="${startY + i * lineHeight}" font-family="Inter" font-weight="500" font-size="${size}" fill="${MUTED}">${escapeXml(line)}</text>`,
		)
		.join('');
}

function footer(rightText: string): string {
	return `${wordmark(MARGIN, 496, 0.85)}
	<text x="${WIDTH - MARGIN}" y="540" font-family="JetBrains Mono" font-weight="500" font-size="20" letter-spacing="2.4" fill="${MUTED}" text-anchor="end">${escapeXml(rightText)}</text>`;
}

function frame(...children: string[]): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
	<rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>
	${grid()}
	${children.join('\n')}
</svg>`;
}

// --- Headshot (about card) -------------------------------------------------

function loadSharp(): typeof import('sharp') {
	const cmsRequire = createRequire(resolve(REPO_ROOT, 'apps/cms/scripts/'));
	return cmsRequire('sharp') as typeof import('sharp');
}

async function headshotDataUri(): Promise<string> {
	const png = await loadSharp()(resolve(WEB_ROOT, 'static/images/about/headshot.webp'))
		.resize(640, 640, { fit: 'cover' })
		.png()
		.toBuffer();
	return `data:image/png;base64,${png.toString('base64')}`;
}

// --- Cards ------------------------------------------------------------------

const SERVICES = [
	{ id: 'database-engineering', station: '01', icon: 'service-database.svg', lines: ['Databases & SQL'] },
	{ id: 'data-pipeline', station: '02', icon: 'service-pipeline.svg', lines: ['Pipelines &', 'Automation'] },
	{ id: 'analytics-reporting', station: '03', icon: 'service-reporting.svg', lines: ['Dashboards &', 'Analytics'] },
	{ id: 'web-development', station: '04', icon: 'service-web.svg', lines: ['Websites &', 'E-commerce'] },
] as const;

async function buildCards(): Promise<Record<string, string>> {
	const cards: Record<string, string> = {};

	for (const s of SERVICES) {
		cards[`services/${s.id}.png`] = frame(
			serviceArt(s.icon, 760, 130, 360, 0.2),
			eyebrow(`SERVICE ${s.station} / 04`),
			overline(),
			titleBlock([...s.lines], 92, 290),
			footer(`yesid.dev/services/${s.id}`),
		);
	}

	cards['routes/services.png'] = frame(
		eyebrow('SERVICES'),
		overline(),
		titleBlock(['Digital', 'Infrastructure'], 76, 272),
		`<g font-family="JetBrains Mono" font-weight="500" font-size="22" letter-spacing="2.2" fill="${MUTED}">
			<text x="724" y="292" fill="${ORANGE}">01</text><text x="776" y="292">DATABASES &amp; SQL</text>
			<text x="724" y="340" fill="${ORANGE}">02</text><text x="776" y="340">PIPELINES &amp; AUTOMATION</text>
			<text x="724" y="388" fill="${ORANGE}">03</text><text x="776" y="388">DASHBOARDS &amp; ANALYTICS</text>
			<text x="724" y="436" fill="${ORANGE}">04</text><text x="776" y="436">WEBSITES &amp; E-COMMERCE</text>
		</g>`,
		footer('yesid.dev/services'),
	);

	cards['routes/contact.png'] = frame(
		eyebrow('CONTACT'),
		`<rect x="${MARGIN}" y="150" width="1040" height="270" rx="10" fill="${YELLOW}"/>`,
		`<text x="130" y="280" font-family="Inter" font-weight="900" font-size="92" letter-spacing="-1.5" fill="${BG}">Let's talk.</text>`,
		`<text x="130" y="368" font-family="JetBrains Mono" font-weight="500" font-size="28" letter-spacing="2.4" fill="${BG}">yesid.dev/contact →</text>`,
		footer('MONTRÉAL · QC'),
	);

	const headshot = await headshotDataUri();
	cards['routes/about.png'] = frame(
		`<clipPath id="headshot-clip"><rect x="780" y="140" width="320" height="320" rx="16"/></clipPath>
		<image href="${headshot}" x="780" y="140" width="320" height="320" clip-path="url(#headshot-clip)"/>
		<rect x="780" y="140" width="320" height="320" rx="16" fill="none" stroke="${ORANGE}" stroke-width="3"/>`,
		eyebrow('ABOUT'),
		overline(),
		titleBlock(['Yesid'], 92, 290),
		subtitleBlock(['Digital Infrastructure', 'Engineer'], 366),
		footer('yesid.dev/about'),
	);

	cards['routes/projects.png'] = frame(
		blueprintArt(590, 130, 0.62, 0.3),
		eyebrow('CASE STUDIES'),
		overline(),
		titleBlock(['Projects'], 92, 290),
		subtitleBlock(['Projects, pipelines, and', 'systems I have built.'], 366),
		footer('yesid.dev/projects'),
	);

	cards['default.en.png'] = frame(
		eyebrow('DIGITAL INFRASTRUCTURE · MONTRÉAL'),
		overline(),
		titleBlock(['Digital infrastructure', 'that moves.'], 84, 280),
		footer('yesid.dev'),
	);

	cards['default.fr.png'] = frame(
		eyebrow('INFRASTRUCTURE NUMÉRIQUE · MONTRÉAL'),
		overline(),
		titleBlock(['Une infrastructure', 'numérique qui bouge.'], 84, 280),
		footer('yesid.dev'),
	);

	// L1 ES pass: tagline mirrors site_meta.tagline.es (CMS is truth).
	cards['default.es.png'] = frame(
		eyebrow('INFRAESTRUCTURA DIGITAL · MONTRÉAL'),
		overline(),
		titleBlock(['Infraestructura digital', 'que se mueve.'], 84, 280),
		footer('yesid.dev'),
	);

	// General site cards, EN + FR + ES (standalone share assets, wired to no
	// route: yesid.dev is EN by default, /fr French, /es Spanish at the flip).
	const SITE_LOCALES = [
		{ file: 'site.en.png', eyebrow: 'DIGITAL INFRASTRUCTURE · MONTRÉAL', tagline: 'Digital infrastructure that moves.' },
		{ file: 'site.fr.png', eyebrow: 'INFRASTRUCTURE NUMÉRIQUE · MONTRÉAL', tagline: 'Une infrastructure numérique qui bouge.' },
		{ file: 'site.es.png', eyebrow: 'INFRAESTRUCTURA DIGITAL · MONTRÉAL', tagline: 'Infraestructura digital que se mueve.' },
	];
	for (const s of SITE_LOCALES) {
		cards[s.file] = frame(
			eyebrow(s.eyebrow),
			overline(200),
			wordmark(MARGIN, 240, 3.4),
			`<text x="${MARGIN}" y="500" font-family="Inter" font-weight="500" font-size="40" fill="${MUTED}">${escapeXml(s.tagline)}</text>`,
			`<text x="${WIDTH - MARGIN}" y="540" font-family="JetBrains Mono" font-weight="500" font-size="20" letter-spacing="2.4" fill="${MUTED}" text-anchor="end">MONTRÉAL · QC</text>`,
		);
	}

	return cards;
}

// --- Render -----------------------------------------------------------------

const cards = await buildCards();
let failed = false;
for (const [file, svg] of Object.entries(cards)) {
	let png: Uint8Array = new Resvg(svg, {
		fitTo: { mode: 'width', value: WIDTH },
		font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Inter' },
	})
		.render()
		.asPng();
	let note = '';
	if (png.byteLength >= BUDGET_BYTES) {
		// Photo-bearing cards blow past the budget as truecolor PNG; a palette
		// re-encode keeps them PNG and far under 150KB with no visible cost at
		// share-preview sizes.
		png = await loadSharp()(Buffer.from(png)).png({ palette: true, quality: 90 }).toBuffer();
		note = ', palette re-encode';
	}
	if (png.byteLength >= BUDGET_BYTES) {
		console.error(`✗ ${file}: ${png.byteLength} bytes exceeds the ${BUDGET_BYTES} budget`);
		failed = true;
		continue;
	}
	const target = resolve(OUT_DIR, file);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, png);
	console.log(`✓ ${file}  ${WIDTH}x${HEIGHT}, ${png.byteLength} bytes${note}`);
}
if (failed) process.exit(1);
