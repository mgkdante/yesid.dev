#!/usr/bin/env bun
/**
 * OG share-card generator (homework #5, slice brand-svg-og-cards; trilingual
 * pass adds fr + es).
 *
 * Mints the static card set: four service cards, the /services, /contact,
 * /about and /projects route cards, home defaults and the general site card,
 * each in en + fr + es. 1200x630 PNG, hard budget <150KB, text inside 80px
 * margins, bg #141414 / text #F5F5F0 / orange #E07800 / yellow #FFB627.
 *
 * EN keeps the legacy no-suffix filename (services/<id>.png, routes/<route>.png)
 * so the existing SeoHead + media-assets wiring is untouched; fr + es land at
 * the .<locale>.png sibling that the locale-aware resolver reaches for.
 *
 * Every dot is orange. Service and route TITLES wrap to two lines and auto-fit
 * their font size so no line overlaps the service logo art on the right, which
 * matters most for the longer fr/es strings ("Bases de données et SQL").
 *
 * Service + tagline copy is the canonical CMS truth (apps/web/src/lib/content/
 * services.ts, site_meta). Every card carries the outlined wordmark ("yesid" +
 * orange period) read from apps/cms/brand/yesid-wordmark.svg.
 *
 * Same rendering stack as generate-og-default.ts: hand-built SVG -> resvg with
 * the vendored OG TTFs (Inter 500/900, JetBrains Mono 500). The /about card
 * embeds the headshot; sharp (an apps/cms dependency) converts the committed
 * webp to PNG at render time via createRequire.
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

type Locale = 'en' | 'fr' | 'es';
const LOCALES: readonly Locale[] = ['en', 'fr', 'es'];
/** EN keeps the legacy no-suffix path; fr/es get a .<locale> suffix. */
const suffix = (loc: Locale) => (loc === 'en' ? '' : `.${loc}`);

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

/** The wordmark as a positioned group. Source viewBox is 130x64. Dot is always orange. */
function wordmark(x: number, y: number, scale: number, letterFill = TEXT): string {
	return `<g transform="translate(${x},${y}) scale(${scale})">
		<path d="${lettersPath}" fill="${letterFill}"/>
		<path d="${dotPath}" fill="${ORANGE}"/>
	</g>`;
}

// --- Text measurement + auto-fit ------------------------------------------

/** Exact rendered width of a single line at a given size, via resvg's bbox. */
function measureWidth(text: string, size: number, family: string, weight: number): number {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="400"><text x="0" y="200" font-family="${family}" font-weight="${weight}" font-size="${size}">${escapeXml(text)}</text></svg>`;
	const bbox = new Resvg(svg, {
		font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Inter' },
	}).getBBox();
	return bbox?.width ?? 0;
}

/** Largest size (stepping down from `max`) at which every line fits `maxWidth`. */
function fitSize(
	lines: readonly string[],
	maxWidth: number,
	{ max, min, family, weight }: { max: number; min: number; family: string; weight: number },
): number {
	for (let size = max; size > min; size -= 2) {
		if (lines.every((line) => measureWidth(line, size, family, weight) <= maxWidth)) return size;
	}
	return min;
}

// --- Art helpers ----------------------------------------------------------

function escapeXml(s: string): string {
	return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/** Inline a service icon (48x48, var(--primary) tokens) recolored for cards. */
function serviceArt(name: string, x: number, y: number, size: number, opacity: number): string {
	const raw = readFileSync(resolve(WEB_ROOT, `static/svg/services/${name}`), 'utf8');
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

/** Two-line title, vertically centered on `midY`, auto-fit to `maxWidth`. */
function titleBlock(lines: readonly string[], maxWidth: number, midY: number, fill = TEXT): string {
	const size = fitSize(lines, maxWidth, { max: 92, min: 52, family: 'Inter', weight: 900 });
	const lineHeight = Math.round(size * 1.08);
	const startY = midY - ((lines.length - 1) * lineHeight) / 2 + size * 0.34;
	return lines
		.map(
			(line, i) =>
				`<text x="${MARGIN}" y="${startY + i * lineHeight}" font-family="Inter" font-weight="900" font-size="${size}" letter-spacing="-1.5" fill="${fill}">${escapeXml(line)}</text>`,
		)
		.join('');
}

function subtitleBlock(lines: readonly string[], startY: number, size = 40): string {
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

// --- Trilingual copy (CMS truth for names + taglines) ----------------------

type L = Record<Locale, string>;
type LL = Record<Locale, readonly string[]>;

/** The service-logo art sits at x=760, so the title band is capped short. */
const SERVICE_TITLE_MAXW = 620;
/** The services-listing card has the service line-list on the right at x=724. */
const SERVICES_TITLE_MAXW = 600;

const SERVICES = [
	{
		id: 'database-engineering',
		station: '01',
		icon: 'service-database.svg',
		// EN two-line per operator: "databases on one line, SQL on the next".
		lines: {
			en: ['Databases', '& SQL'],
			fr: ['Bases de données', 'et SQL'],
			es: ['Bases de datos', 'y SQL'],
		} satisfies LL,
	},
	{
		id: 'data-pipeline',
		station: '02',
		icon: 'service-pipeline.svg',
		lines: {
			en: ['Pipelines &', 'Automation'],
			fr: ['Pipelines et', 'automatisation'],
			es: ['Pipelines y', 'automatización'],
		} satisfies LL,
	},
	{
		id: 'analytics-reporting',
		station: '03',
		icon: 'service-reporting.svg',
		lines: {
			en: ['Dashboards &', 'Analytics'],
			fr: ['Tableaux de bord', 'et analytique'],
			es: ['Tableros y', 'analítica'],
		} satisfies LL,
	},
	{
		id: 'web-development',
		station: '04',
		icon: 'service-web.svg',
		lines: {
			en: ['Websites &', 'E-commerce'],
			fr: ['Sites web et', 'commerce en ligne'],
			es: ['Sitios web y', 'e-commerce'],
		} satisfies LL,
	},
] as const;

const SERVICE_EYEBROW: L = { en: 'SERVICE', fr: 'SERVICE', es: 'SERVICIO' };

/** Uppercase service names for the services-listing line-list, per locale. */
const SERVICE_LIST: Record<Locale, readonly string[]> = {
	en: ['DATABASES & SQL', 'PIPELINES & AUTOMATION', 'DASHBOARDS & ANALYTICS', 'WEBSITES & E-COMMERCE'],
	fr: [
		'BASES DE DONNÉES ET SQL',
		'PIPELINES ET AUTOMATISATION',
		'TABLEAUX DE BORD ET ANALYTIQUE',
		'SITES WEB ET COMMERCE EN LIGNE',
	],
	es: [
		'BASES DE DATOS Y SQL',
		'PIPELINES Y AUTOMATIZACIÓN',
		'TABLEROS Y ANALÍTICA',
		'SITIOS WEB Y E-COMMERCE',
	],
};

const ROUTES = {
	services: {
		eyebrow: { en: 'SERVICES', fr: 'SERVICES', es: 'SERVICIOS' } satisfies L,
		title: {
			en: ['Digital', 'Infrastructure'],
			fr: ['Infrastructure', 'numérique'],
			es: ['Infraestructura', 'digital'],
		} satisfies LL,
	},
	about: {
		eyebrow: { en: 'ABOUT', fr: 'À PROPOS', es: 'ACERCA DE' } satisfies L,
		subtitle: {
			en: ['Digital Infrastructure', 'Engineer'],
			fr: ['Ingénieur en', 'infrastructure numérique'],
			es: ['Ingeniero de', 'infraestructura digital'],
		} satisfies LL,
	},
	projects: {
		eyebrow: { en: 'CASE STUDIES', fr: 'ÉTUDES DE CAS', es: 'CASOS DE ESTUDIO' } satisfies L,
		title: { en: 'Projects', fr: 'Projets', es: 'Proyectos' } satisfies L,
		subtitle: {
			en: ['Projects, pipelines, and', 'systems I have built.'],
			fr: ['Projets, pipelines et', "systèmes que j'ai bâtis."],
			es: ['Proyectos, pipelines y', 'sistemas que he construido.'],
		} satisfies LL,
	},
	contact: {
		eyebrow: { en: 'CONTACT', fr: 'CONTACT', es: 'CONTACTO' } satisfies L,
		big: { en: "Let's talk.", fr: 'Parlons.', es: 'Hablemos.' } satisfies L,
	},
} as const;

const DEFAULTS: Record<Locale, { eyebrow: string; title: readonly string[] }> = {
	en: { eyebrow: 'DIGITAL INFRASTRUCTURE · MONTRÉAL', title: ['Digital infrastructure', 'that moves.'] },
	fr: { eyebrow: 'INFRASTRUCTURE NUMÉRIQUE · MONTRÉAL', title: ['Une infrastructure', 'numérique qui bouge.'] },
	es: { eyebrow: 'INFRAESTRUCTURA DIGITAL · MONTRÉAL', title: ['Infraestructura digital', 'que se mueve.'] },
};

const SITE: Record<Locale, { eyebrow: string; tagline: string }> = {
	en: { eyebrow: 'DIGITAL INFRASTRUCTURE · MONTRÉAL', tagline: 'Digital infrastructure that moves.' },
	fr: { eyebrow: 'INFRASTRUCTURE NUMÉRIQUE · MONTRÉAL', tagline: 'Une infrastructure numérique qui bouge.' },
	es: { eyebrow: 'INFRAESTRUCTURA DIGITAL · MONTRÉAL', tagline: 'Infraestructura digital que se mueve.' },
};

// --- Cards ------------------------------------------------------------------

async function buildCards(): Promise<Record<string, string>> {
	const cards: Record<string, string> = {};

	for (const loc of LOCALES) {
		const sfx = suffix(loc);

		// Service cards: two-line title, auto-fit clear of the logo art.
		for (const s of SERVICES) {
			cards[`services/${s.id}${sfx}.png`] = frame(
				serviceArt(s.icon, 760, 130, 360, 0.2),
				eyebrow(`${SERVICE_EYEBROW[loc]} ${s.station} / 04`),
				overline(),
				titleBlock(s.lines[loc], SERVICE_TITLE_MAXW, 350),
				footer(`yesid.dev/services/${s.id}`),
			);
		}

		// Services listing: title left, service line-list right (font auto-fit
		// so the longest localized name clears the right margin).
		const listSize = fitSize(SERVICE_LIST[loc], WIDTH - 776 - MARGIN, {
			max: 22,
			min: 15,
			family: 'JetBrains Mono',
			weight: 500,
		});
		const listRows = SERVICE_LIST[loc]
			.map((name, i) => {
				const y = 292 + i * 48;
				return `<text x="724" y="${y}" font-family="JetBrains Mono" font-weight="500" font-size="${listSize}" letter-spacing="2.2" fill="${ORANGE}">0${i + 1}</text><text x="776" y="${y}" font-family="JetBrains Mono" font-weight="500" font-size="${listSize}" letter-spacing="1.6" fill="${MUTED}">${escapeXml(name)}</text>`;
			})
			.join('\n');
		cards[`routes/services${sfx}.png`] = frame(
			eyebrow(ROUTES.services.eyebrow[loc]),
			overline(),
			titleBlock(ROUTES.services.title[loc], SERVICES_TITLE_MAXW, 350),
			`<g>${listRows}</g>`,
			footer('yesid.dev/services'),
		);

		// Contact: yellow slab, big line, mono url.
		cards[`routes/contact${sfx}.png`] = frame(
			eyebrow(ROUTES.contact.eyebrow[loc]),
			`<rect x="${MARGIN}" y="150" width="1040" height="270" rx="10" fill="${YELLOW}"/>`,
			`<text x="130" y="280" font-family="Inter" font-weight="900" font-size="92" letter-spacing="-1.5" fill="${BG}">${escapeXml(ROUTES.contact.big[loc])}</text>`,
			`<text x="130" y="368" font-family="JetBrains Mono" font-weight="500" font-size="28" letter-spacing="2.4" fill="${BG}">yesid.dev/contact →</text>`,
			footer('MONTRÉAL · QC'),
		);

		// About: headshot + name + role subtitle.
		const headshot = await headshotDataUri();
		cards[`routes/about${sfx}.png`] = frame(
			`<clipPath id="headshot-clip"><rect x="780" y="140" width="320" height="320" rx="16"/></clipPath>
			<image href="${headshot}" x="780" y="140" width="320" height="320" clip-path="url(#headshot-clip)"/>
			<rect x="780" y="140" width="320" height="320" rx="16" fill="none" stroke="${ORANGE}" stroke-width="3"/>`,
			eyebrow(ROUTES.about.eyebrow[loc]),
			overline(),
			titleBlock(['Yesid'], 620, 320),
			subtitleBlock(ROUTES.about.subtitle[loc], 402, 36),
			footer('yesid.dev/about'),
		);

		// Projects: blueprint art + title + subtitle.
		cards[`routes/projects${sfx}.png`] = frame(
			blueprintArt(590, 130, 0.62, 0.3),
			eyebrow(ROUTES.projects.eyebrow[loc]),
			overline(),
			titleBlock([ROUTES.projects.title[loc]], 620, 320),
			subtitleBlock(ROUTES.projects.subtitle[loc], 402, 38),
			footer('yesid.dev/projects'),
		);

		// Home default: tagline stack.
		cards[`default.${loc}.png`] = frame(
			eyebrow(DEFAULTS[loc].eyebrow),
			overline(),
			titleBlock(DEFAULTS[loc].title, WIDTH - 2 * MARGIN, 330),
			footer('yesid.dev'),
		);

		// General site card: big wordmark + tagline.
		cards[`site.${loc}.png`] = frame(
			eyebrow(SITE[loc].eyebrow),
			overline(200),
			wordmark(MARGIN, 240, 3.4),
			`<text x="${MARGIN}" y="500" font-family="Inter" font-weight="500" font-size="40" fill="${MUTED}">${escapeXml(SITE[loc].tagline)}</text>`,
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
