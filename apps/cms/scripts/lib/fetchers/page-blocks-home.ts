/**
 * Home-page block fetchers — 7 blocks under pages('home'):
 *   hero, manifesto, proof-reel, services-grid, about-intro, cta, closer
 *
 * Each block is queried directly via `readItems('block_*', { limit: 1 })`
 * rather than via the M2A pages query. Same trade-off as page-blocks-simple:
 * loses page-context linkage but vastly simpler code; P7 drift check catches
 * any mismatch against the runtime adapter's M2A-validated output.
 *
 * Mirrors apps/web/src/lib/adapters/directus.ts transformBlock<X> functions.
 */

import { readItems } from '@directus/sdk';
import { toLocalizedString, toLocalizedJSON } from '../locale';
import type { LocalizedString } from '../schemas/shared';
import {
	HeroContentSchema,
	ManifestoContentSchema,
	ProofReelContentSchema,
	ServicesGridContentSchema,
	AboutIntroContentSchema,
	CtaContentSchema,
	CloserContentSchema,
	type HeroContent,
	type HeroAnimContent,
	type ManifestoContent,
	type ProofReelContent,
	type ServicesGridContent,
	type AboutIntroContent,
	type CtaContent,
	type CloserContent,
} from '../schemas/page-blocks';
import type { FetcherContext } from './types';

interface BlockRow {
	id: number;
	translations?: ReadonlyArray<Record<string, unknown>>;
	[key: string]: unknown;
}

// ---------------------------------------------------------------------------
// block_hero
// ---------------------------------------------------------------------------

export function toHeroContent(raw: BlockRow): HeroContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	const headline = toLocalizedJSON(tr, 'headline') as HeroContent['headline'];
	const sqlPanel = toLocalizedJSON(tr, 'sql_panel') as HeroContent['sqlPanel'];
	const refreshButton = toLocalizedJSON(tr, 'refresh_button') as HeroContent['refreshButton'];
	const heroAnimRaw = toLocalizedJSON(tr, 'hero_anim') as
		| { scrollDown?: LocalizedString | string }
		| null;
	const scrollDownRaw =
		heroAnimRaw && typeof heroAnimRaw === 'object' && 'scrollDown' in heroAnimRaw
			? heroAnimRaw.scrollDown
			: undefined;
	const scrollDown: HeroAnimContent['scrollDown'] =
		scrollDownRaw && typeof scrollDownRaw === 'object' && 'en' in scrollDownRaw
			? (scrollDownRaw as LocalizedString)
			: toLocalizedString(tr, 'scroll_down');
	return {
		headline,
		subheadline: toLocalizedString(tr, 'subheadline'),
		subtitle: toLocalizedString(tr, 'subtitle'),
		ctaWork: toLocalizedString(tr, 'cta_work'),
		ctaContact: toLocalizedString(tr, 'cta_contact'),
		sqlPanel,
		refreshButton,
		heroAnim: { scrollDown },
	};
}

export async function fetchHeroContent({ client }: FetcherContext): Promise<HeroContent> {
	const rows = (await client.request(
		readItems('block_hero', {
			fields: ['*', { translations: ['*'] } as unknown as string],
			limit: 1,
		}),
	)) as unknown as BlockRow[];
	if (rows.length === 0) throw new Error('[fetchHeroContent] no block_hero row found');
	return HeroContentSchema.parse(toHeroContent(rows[0]));
}

// ---------------------------------------------------------------------------
// block_manifesto
// ---------------------------------------------------------------------------

export function toManifestoContent(raw: BlockRow): ManifestoContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	const statement = toLocalizedJSON(tr, 'statement') as ManifestoContent['statement'];
	const terminal = toLocalizedJSON(tr, 'terminal') as ManifestoContent['terminal'];
	const edgeLeft = toLocalizedJSON(tr, 'edge_left') as ManifestoContent['edgeLeft'];
	const edgeRight = toLocalizedJSON(tr, 'edge_right') as ManifestoContent['edgeRight'];
	const edgeBottom = toLocalizedJSON(tr, 'edge_bottom') as ManifestoContent['edgeBottom'];
	const transit = toLocalizedJSON(tr, 'transit') as ManifestoContent['transit'];
	const ticks = Array.isArray(raw.ticks) ? (raw.ticks as string[]) : [];

	// pills: serviceId is plain (not translatable); label is LocalizedString
	const pillsByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		const rawPills = row.pills;
		if (Array.isArray(rawPills)) {
			pillsByLocale.set(code, rawPills as Array<Record<string, unknown>>);
		}
	}
	const enPills = pillsByLocale.get('en') ?? [];
	const pills: ManifestoContent['pills'] = enPills.map((enPill, idx) => {
		const labelLS: LocalizedString = {
			en: typeof enPill.label === 'string' ? enPill.label : '',
		};
		const frPill = pillsByLocale.get('fr')?.[idx];
		if (frPill && typeof frPill.label === 'string' && frPill.label.length > 0) {
			labelLS.fr = frPill.label;
		}
		const esPill = pillsByLocale.get('es')?.[idx];
		if (esPill && typeof esPill.label === 'string' && esPill.label.length > 0) {
			labelLS.es = esPill.label;
		}
		return {
			label: labelLS,
			serviceId: typeof enPill.serviceId === 'string' ? enPill.serviceId : '',
		};
	});

	// hiddenTransitLines: name is LocalizedString; color is plain
	const htlByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		const rawLines = row.hidden_transit_lines;
		if (Array.isArray(rawLines)) {
			htlByLocale.set(code, rawLines as Array<Record<string, unknown>>);
		}
	}
	const enLines =
		htlByLocale.get('en') ??
		(Array.isArray(raw.hidden_transit_lines)
			? (raw.hidden_transit_lines as Array<Record<string, unknown>>)
			: []);
	const hiddenTransitLines: ManifestoContent['hiddenTransitLines'] = enLines.map((enLine, idx) => {
		const nameLS: LocalizedString = {
			en: typeof enLine.name === 'string' ? enLine.name : '',
		};
		const frLine = htlByLocale.get('fr')?.[idx];
		if (frLine && typeof frLine.name === 'string' && frLine.name.length > 0) {
			nameLS.fr = frLine.name;
		}
		const esLine = htlByLocale.get('es')?.[idx];
		if (esLine && typeof esLine.name === 'string' && esLine.name.length > 0) {
			nameLS.es = esLine.name;
		}
		const color = typeof enLine.color === 'string' ? enLine.color : '';
		return { name: nameLS, color };
	});

	return {
		statement,
		terminal,
		pills,
		edgeLeft,
		edgeRight,
		edgeBottom,
		transit,
		ticks,
		hiddenTransitLines,
	};
}

export async function fetchManifestoContent({ client }: FetcherContext): Promise<ManifestoContent> {
	const rows = (await client.request(
		readItems('block_manifesto', {
			fields: ['*', { translations: ['*'] } as unknown as string],
			limit: 1,
		}),
	)) as unknown as BlockRow[];
	if (rows.length === 0) throw new Error('[fetchManifestoContent] no block_manifesto row found');
	return ManifestoContentSchema.parse(toManifestoContent(rows[0]));
}

// ---------------------------------------------------------------------------
// block_proof_reel
// ---------------------------------------------------------------------------

export function toProofReelContent(raw: BlockRow): ProofReelContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	const slugs = Array.isArray(raw.slugs) ? (raw.slugs as string[]) : [];
	const images =
		raw.images !== null && typeof raw.images === 'object' && !Array.isArray(raw.images)
			? (raw.images as Record<string, string>)
			: {};
	return {
		heading: toLocalizedString(tr, 'heading'),
		headingDot: toLocalizedString(tr, 'heading_dot'),
		subheading: toLocalizedString(tr, 'subheading'),
		sectionLabel: toLocalizedString(tr, 'section_label'),
		viewAllLabel: toLocalizedString(tr, 'view_all_label'),
		viewAllHref: typeof raw.view_all_href === 'string' ? raw.view_all_href : '/work',
		toggleColorAria: toLocalizedString(tr, 'toggle_color_aria'),
		slugs,
		images,
	};
}

export async function fetchProofReelContent({ client }: FetcherContext): Promise<ProofReelContent> {
	const rows = (await client.request(
		readItems('block_proof_reel', {
			fields: ['*', { translations: ['*'] } as unknown as string],
			limit: 1,
		}),
	)) as unknown as BlockRow[];
	if (rows.length === 0) throw new Error('[fetchProofReelContent] no block_proof_reel row found');
	return ProofReelContentSchema.parse(toProofReelContent(rows[0]));
}

// ---------------------------------------------------------------------------
// block_services_grid
// ---------------------------------------------------------------------------

export function toServicesGridContent(raw: BlockRow): ServicesGridContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	return {
		heading: toLocalizedString(tr, 'heading'),
		headingDot: toLocalizedString(tr, 'heading_dot'),
		subheading: toLocalizedString(tr, 'subheading'),
		viewIllustrationAria: toLocalizedString(tr, 'view_illustration_aria'),
		viewAllLink: toLocalizedString(tr, 'view_all_link'),
	};
}

export async function fetchServicesGridContent({
	client,
}: FetcherContext): Promise<ServicesGridContent> {
	const rows = (await client.request(
		readItems('block_services_grid', {
			fields: ['*', { translations: ['*'] } as unknown as string],
			limit: 1,
		}),
	)) as unknown as BlockRow[];
	if (rows.length === 0)
		throw new Error('[fetchServicesGridContent] no block_services_grid row found');
	return ServicesGridContentSchema.parse(toServicesGridContent(rows[0]));
}

// ---------------------------------------------------------------------------
// block_about_intro
// ---------------------------------------------------------------------------

export function toAboutIntroContent(raw: BlockRow): AboutIntroContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	const locationJson = toLocalizedJSON(tr, 'location') as AboutIntroContent['location'] | null;
	const stackItems = Array.isArray(raw.stack_items) ? (raw.stack_items as string[]) : [];
	return {
		name: toLocalizedString(tr, 'name'),
		title: toLocalizedString(tr, 'title'),
		bio: toLocalizedString(tr, 'bio'),
		moreLink: toLocalizedString(tr, 'more_link'),
		stackLabel: toLocalizedString(tr, 'stack_label'),
		stackItems,
		locationLabel: toLocalizedString(tr, 'location_label'),
		location: locationJson ?? { city: { en: '' }, region: { en: '' } },
		interestsLabel: toLocalizedString(tr, 'interests_label'),
		interests: toLocalizedString(tr, 'interests'),
	};
}

export async function fetchAboutIntroContent({
	client,
}: FetcherContext): Promise<AboutIntroContent> {
	const rows = (await client.request(
		readItems('block_about_intro', {
			fields: ['*', { translations: ['*'] } as unknown as string],
			limit: 1,
		}),
	)) as unknown as BlockRow[];
	if (rows.length === 0)
		throw new Error('[fetchAboutIntroContent] no block_about_intro row found');
	return AboutIntroContentSchema.parse(toAboutIntroContent(rows[0]));
}

// ---------------------------------------------------------------------------
// block_cta
// ---------------------------------------------------------------------------

export function toCtaContent(raw: BlockRow): CtaContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	return {
		heading: toLocalizedString(tr, 'heading'),
		subtitle: toLocalizedString(tr, 'subtitle'),
		ctaContact: toLocalizedString(tr, 'cta_contact'),
		ctaGithub: toLocalizedString(tr, 'cta_github'),
	};
}

export async function fetchCtaContent({ client }: FetcherContext): Promise<CtaContent> {
	const rows = (await client.request(
		readItems('block_cta', {
			fields: ['*', { translations: ['*'] } as unknown as string],
			limit: 1,
		}),
	)) as unknown as BlockRow[];
	if (rows.length === 0) throw new Error('[fetchCtaContent] no block_cta row found');
	return CtaContentSchema.parse(toCtaContent(rows[0]));
}

// ---------------------------------------------------------------------------
// block_closer
// ---------------------------------------------------------------------------

export function toCloserContent(raw: BlockRow): CloserContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	const ctaJson = toLocalizedJSON(tr, 'cta') as { label?: LocalizedString; href?: string } | null;
	const rowsJson = toLocalizedJSON(tr, 'rows') as CloserContent['rows'] | null;
	const attributionJson = toLocalizedJSON(tr, 'attribution') as
		| { text?: LocalizedString; url?: string }
		| null;
	const terminalJson = toLocalizedJSON(tr, 'terminal') as CloserContent['terminal'] | null;
	return {
		heading: toLocalizedString(tr, 'heading'),
		headingDot: toLocalizedString(tr, 'heading_dot'),
		subheading: toLocalizedString(tr, 'subheading'),
		cta: {
			label: ctaJson?.label ?? { en: '' },
			href:
				typeof raw.cta_href === 'string' ? raw.cta_href : (ctaJson?.href ?? '/contact'),
		},
		rows: rowsJson ?? {
			contact: { label: { en: '' }, description: { en: '' }, action: { en: '' } },
			connect: { label: { en: '' }, description: { en: '' }, action: { en: '' } },
			read: { label: { en: '' }, action: { en: '' } },
			about: { label: { en: '' }, description: { en: '' }, action: { en: '' } },
		},
		attribution: {
			text: attributionJson?.text ?? { en: '' },
			url:
				typeof raw.attribution_url === 'string'
					? raw.attribution_url
					: (attributionJson?.url ?? ''),
		},
		terminal: terminalJson ?? {
			title: { en: '' },
			city: { en: '' },
			encoding: { en: '' },
			destinationsLabel: { en: '' },
			prompt: { en: '' },
		},
	};
}

export async function fetchCloserContent({ client }: FetcherContext): Promise<CloserContent> {
	const rows = (await client.request(
		readItems('block_closer', {
			fields: ['*', { translations: ['*'] } as unknown as string],
			limit: 1,
		}),
	)) as unknown as BlockRow[];
	if (rows.length === 0) throw new Error('[fetchCloserContent] no block_closer row found');
	return CloserContentSchema.parse(toCloserContent(rows[0]));
}
