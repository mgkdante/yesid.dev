#!/usr/bin/env bun
/**
 * Mints the static share cards: four service cards, the /services, /contact,
 * /about and /projects route cards and the home default, each in en + fr + es.
 * 1200x630 PNG under a hard 150KB budget. The layout lives in src/lib/og/card.ts,
 * shared with the blog and project cards.
 *
 * EN keeps the legacy no-suffix filename (services/<id>.png, routes/<route>.png);
 * fr + es land at the .<locale>.png sibling the locale-aware resolver reaches for.
 *
 * The copy below is explicit and reviewable: this script does not import CMS
 * copy. Titles and support lines reuse approved site wording where it exists.
 *
 *   bun scripts/generate-og-cards.ts                 # writes into static/og
 *   bun scripts/generate-og-cards.ts --out <dir>     # mockup run
 */

import { Resvg } from '@resvg/resvg-js';
import { OG_PALETTE } from '@yesid/seo-kit/og';
import { ogFontFiles } from '@yesid/seo-kit/og/files';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { escapeXml, OG_CARD_WIDTH, type OgCard, type OgCardArt } from '../src/lib/og/card';
import { createOgCardRenderer } from '../src/lib/og/render';
import { SHARE_CTA, type ShareCta, type ShareLocale } from '../src/lib/og/share-copy';

const WEB_ROOT = resolve(import.meta.dir, '..');
const REPO_ROOT = resolve(WEB_ROOT, '../..');

const OUT_FLAG = process.argv.indexOf('--out');
const OUT_DIR =
	OUT_FLAG === -1 ? resolve(WEB_ROOT, 'static/og') : resolve(process.argv[OUT_FLAG + 1] ?? '');

const BUDGET_BYTES = 150_000;
const { muted: MUTED, accent: ORANGE, accentText: YELLOW } = OG_PALETTE;

const LOCALES: readonly ShareLocale[] = ['en', 'fr', 'es'];
const LOCALE_EQ_ARG = process.argv.find((arg) => arg.startsWith('--locale='));
const LOCALE_FLAG = process.argv.indexOf('--locale');
const requestedLocale =
	LOCALE_EQ_ARG?.slice('--locale='.length) ??
	(LOCALE_FLAG === -1 ? undefined : process.argv[LOCALE_FLAG + 1]);
if (requestedLocale && !(LOCALES as readonly string[]).includes(requestedLocale)) {
	throw new Error(`unsupported locale: ${requestedLocale}`);
}
const SELECTED_LOCALES: readonly ShareLocale[] = requestedLocale ? [requestedLocale as ShareLocale] : LOCALES;
/** EN keeps the legacy no-suffix path; fr/es get a .<locale> suffix. */
const suffix = (locale: ShareLocale) => (locale === 'en' ? '' : `.${locale}`);

const renderer = createOgCardRenderer(ogFontFiles);

// --- Art -------------------------------------------------------------------

function innerSvg(raw: string): string {
	return raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

/** A service icon (48x48, var(--primary) tokens) recolored for cards. */
function serviceArt(name: string): OgCardArt {
	const size = 300;
	const inner = innerSvg(readFileSync(resolve(WEB_ROOT, `static/svg/services/${name}`), 'utf8'))
		.replaceAll('var(--primary)', ORANGE)
		.replaceAll('var(--accent)', YELLOW);
	return {
		svg: `<g transform="translate(820,146) scale(${size / 48})" opacity="0.28">${inner}</g>`,
		contentWidth: 700,
	};
}

/** The digital-infrastructure blueprint (840x520, currentColor). */
function blueprintArt(): OgCardArt {
	const inner = innerSvg(
		readFileSync(resolve(WEB_ROOT, 'src/lib/assets/project-fallbacks/digital-desktop.svg'), 'utf8'),
	).replaceAll('currentColor', ORANGE);
	return {
		svg: `<g transform="translate(720,170) scale(0.5)" opacity="0.32" fill="none" stroke="${ORANGE}">${inner}</g>`,
		contentWidth: 610,
	};
}

function loadSharp(): typeof import('sharp') {
	const cmsRequire = createRequire(resolve(REPO_ROOT, 'apps/cms/scripts/'));
	return cmsRequire('sharp') as typeof import('sharp');
}

/** The four services as a station list beside the /services title. */
function serviceListArt(rows: readonly string[]): OgCardArt {
	const numberX = 730;
	const nameX = 780;
	const longest = Math.max(
		...rows.map((row) => renderer.measure(row, { family: 'JetBrains Mono', weight: 500, tracking: 0.07 })),
	);
	const size = Math.min(22, Math.floor((1120 - nameX) / longest));
	const svg = rows
		.map((row, index) => {
			const y = 214 + index * 58;
			return `<text x="${numberX}" y="${y}" font-family="JetBrains Mono" font-weight="500" font-size="${size}" letter-spacing="${0.1 * size}" fill="${ORANGE}">0${index + 1}</text><text x="${nameX}" y="${y}" font-family="JetBrains Mono" font-weight="500" font-size="${size}" letter-spacing="${0.07 * size}" fill="${MUTED}">${escapeXml(row)}</text>`;
		})
		.join('\n');
	return { svg, contentWidth: 610 };
}

// --- Trilingual card copy --------------------------------------------------

type L = Record<ShareLocale, string>;

const SERVICES: ReadonlyArray<{ id: string; icon: string; title: L; subtitle: L }> = [
	{
		id: 'web-development',
		icon: 'service-web.svg',
		title: {
			en: 'Websites &\nOnline Stores',
			fr: 'Sites web et\nboutiques en ligne',
			es: 'Sitios web y\ntiendas en línea',
		},
		subtitle: {
			en: 'Sharp, fast and found on Google.',
			fr: 'Beaux, rapides et trouvables sur Google.',
			es: 'Bonitos, rápidos y visibles en Google.',
		},
	},
	{
		id: 'data-pipeline',
		icon: 'service-pipeline.svg',
		title: { en: 'Automation\n& AI', fr: 'Automatisation\net IA', es: 'Automatización\ne IA' },
		subtitle: {
			en: 'No more copying data by hand.',
			fr: 'Fini le copier-coller.',
			es: 'Se acabó copiar a mano.',
		},
	},
	{
		id: 'analytics-reporting',
		icon: 'service-reporting.svg',
		title: {
			en: 'Reports &\nDashboards',
			fr: 'Rapports et\ntableaux de bord',
			es: 'Reportes y\ntableros',
		},
		subtitle: {
			en: 'One set of numbers your team trusts.',
			fr: 'Des chiffres fiables pour toute l’équipe.',
			es: 'Números en los que tu equipo confía.',
		},
	},
	{
		id: 'database-engineering',
		icon: 'service-database.svg',
		title: {
			en: 'Software &\nDatabases',
			fr: 'Logiciels et\nbases de données',
			es: 'Software y\nbases de datos',
		},
		subtitle: {
			en: 'Off the spreadsheets, onto a real system.',
			fr: 'Fini les fichiers Excel.',
			es: 'Adiós al Excel.',
		},
	},
];

const SERVICE_EYEBROW: L = { en: 'SERVICE · MONTRÉAL', fr: 'SERVICE · MONTRÉAL', es: 'SERVICIO · MONTREAL' };

const SERVICE_LIST: Record<ShareLocale, readonly string[]> = {
	en: ['WEBSITES & STORES', 'AUTOMATION & AI', 'REPORTS & DASHBOARDS', 'SOFTWARE & DATABASES'],
	fr: ['SITES WEB ET BOUTIQUES', 'AUTOMATISATION ET IA', 'RAPPORTS ET TABLEAUX', 'LOGICIELS ET BASES'],
	es: ['SITIOS WEB Y TIENDAS', 'AUTOMATIZACIÓN E IA', 'REPORTES Y TABLEROS', 'SOFTWARE Y BASES'],
};

const ROUTES = {
	services: {
		eyebrow: { en: 'SERVICES', fr: 'SERVICES', es: 'SERVICIOS' } satisfies L,
		title: {
			en: 'Wherever it’s stuck,\nwe start there',
			fr: 'Là où ça accroche,\non commence',
			es: 'Donde se atasca,\nahí empezamos',
		} satisfies L,
	},
	about: {
		eyebrow: { en: 'ABOUT', fr: 'À PROPOS', es: 'ACERCA DE' } satisfies L,
		subtitle: {
			en: 'Freelance digital\ninfrastructure developer',
			fr: 'Développeur d’infrastructure\nnumérique à la pige',
			es: 'Desarrollador freelance\nde infraestructura digital',
		} satisfies L,
	},
	projects: {
		eyebrow: { en: 'CASE STUDIES', fr: 'ÉTUDES DE CAS', es: 'CASOS DE ESTUDIO' } satisfies L,
		title: { en: 'What I’ve built', fr: 'Ce que j’ai bâti', es: 'Lo que he construido' } satisfies L,
		subtitle: {
			en: 'Websites, online stores, automation and a live transit platform.',
			fr: 'Sites web, boutiques, automatisation et une plateforme de transport en direct.',
			es: 'Sitios web, tiendas, automatización y una plataforma de transporte en vivo.',
		} satisfies L,
	},
	contact: {
		eyebrow: { en: 'CONTACT', fr: 'CONTACT', es: 'CONTACTO' } satisfies L,
		title: { en: 'Let’s talk', fr: 'Parlons', es: 'Hablemos' } satisfies L,
		subtitle: {
			en: 'Tell me what’s stuck. I reply in about 24 hours.',
			fr: 'Dis-moi ce qui accroche. Je réponds en 24 h environ.',
			es: 'Cuéntame qué está atascado. Respondo en unas 24 h.',
		} satisfies L,
	},
} as const;

const HOME = {
	eyebrow: {
		en: 'WEBSITES · AUTOMATION · DATA · SOFTWARE',
		fr: 'SITES WEB · AUTOMATISATION · DONNÉES · LOGICIELS',
		es: 'SITIOS WEB · AUTOMATIZACIÓN · DATOS · SOFTWARE',
	} satisfies L,
	title: {
		en: 'Systems that\ndon’t break',
		fr: 'Des systèmes qui\nne cassent pas',
		es: 'Sistemas que\nno se rompen',
	} satisfies L,
	subtitle: {
		en: 'More productivity for Canadian businesses, without downtime.',
		fr: 'Plus de productivité pour les entreprises canadiennes, sans pannes.',
		es: 'Más productividad para las empresas canadienses, sin caídas.',
	} satisfies L,
} as const;

// --- Cards -----------------------------------------------------------------

const cta = (share: ShareCta, locale: ShareLocale): Pick<OgCard, 'cta' | 'ctaTone'> => ({
	cta: share.label[locale],
	ctaTone: share.tone,
});

async function buildCards(): Promise<Record<string, OgCard>> {
	const cards: Record<string, OgCard> = {};

	for (const locale of SELECTED_LOCALES) {
		const sfx = suffix(locale);

		for (const service of SERVICES) {
			cards[`services/${service.id}${sfx}.png`] = {
				eyebrow: SERVICE_EYEBROW[locale],
				title: service.title[locale],
				subtitle: service.subtitle[locale],
				art: serviceArt(service.icon),
				...cta(SHARE_CTA.service, locale),
			};
		}

		cards[`routes/services${sfx}.png`] = {
			eyebrow: ROUTES.services.eyebrow[locale],
			title: ROUTES.services.title[locale],
			art: serviceListArt(SERVICE_LIST[locale]),
			...cta(SHARE_CTA.services, locale),
		};

		cards[`routes/contact${sfx}.png`] = {
			eyebrow: ROUTES.contact.eyebrow[locale],
			title: ROUTES.contact.title[locale],
			subtitle: ROUTES.contact.subtitle[locale],
			...cta(SHARE_CTA.contact, locale),
		};

		cards[`routes/about${sfx}.png`] = {
			eyebrow: ROUTES.about.eyebrow[locale],
			title: 'Yesid',
			subtitle: ROUTES.about.subtitle[locale],
			...cta(SHARE_CTA.about, locale),
		};

		cards[`routes/projects${sfx}.png`] = {
			eyebrow: ROUTES.projects.eyebrow[locale],
			title: ROUTES.projects.title[locale],
			subtitle: ROUTES.projects.subtitle[locale],
			art: blueprintArt(),
			...cta(SHARE_CTA.projects, locale),
		};

		cards[`default.${locale}.png`] = {
			eyebrow: HOME.eyebrow[locale],
			title: HOME.title[locale],
			subtitle: HOME.subtitle[locale],
			...cta(SHARE_CTA.home, locale),
		};
	}

	return cards;
}

// --- Render ----------------------------------------------------------------

const cards = await buildCards();
let failed = false;
for (const [file, card] of Object.entries(cards)) {
	let png: Uint8Array = new Resvg(renderer.svg(card), {
		fitTo: { mode: 'width', value: OG_CARD_WIDTH },
		font: { fontFiles: [...ogFontFiles], loadSystemFonts: false, defaultFontFamily: 'Inter' },
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
	console.log(`✓ ${file}  ${OG_CARD_WIDTH}x630, ${png.byteLength} bytes${note}`);
}
if (failed) process.exit(1);
