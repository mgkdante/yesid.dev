/**
 * Home-page block fetchers — 7 blocks under pages('home'):
 *   hero, manifesto, proof-reel, services-grid, about-intro, cta, closer
 *
 * Each block is queried directly via `readSingleton` + `asSingletonRow`
 * (shape-tolerant during flips) rather than via the M2A pages query. Same
 * trade-off as page-blocks-simple: loses page-context linkage but vastly
 * simpler code; P7 drift check catches any mismatch against the runtime
 * adapter's M2A-validated output.
 *
 * pages / pages_blocks / pages_translations (slice-28.5, audit #69): because
 * every fetcher queries block_* collections directly, the pages M2A trio is
 * ADMIN-GROUPING-ONLY — pages_translations.title (and the rest of the trio)
 * is read by no export path and cannot affect rendered output. Translators
 * should skip it. The matching field-note edit in the Directus schema
 * (snapshot/collections/pages_translations.json) is flagged to slice-26 —
 * schema changes are drift-gated and out of 28.5 scope. (The dormant
 * directus.ts adapter does read the M2A tree; that path is the slice-26
 * parity oracle, not production.)
 *
 * Mirrors apps/web/src/lib/adapters/directus.ts transformBlock<X> functions.
 */

import { readSingleton } from '@directus/sdk';
import { toLocalizedString } from '../locale';
import { asSingletonRow } from './singleton';
import {
	HeroContentSchema,
	ManifestoContentSchema,
	ProofReelContentSchema,
	ServicesGridContentSchema,
	AboutIntroContentSchema,
	CtaContentSchema,
	CloserContentSchema,
	type LocalizedString,
	type HeroContent,
	type ManifestoContent,
	type ProofReelContent,
	type ServicesGridContent,
	type AboutIntroContent,
	type CtaContent,
	type CloserContent,
} from '@repo/shared';
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
	const tr = (raw.translations ?? []) as ReadonlyArray<
		Record<string, unknown> & { languages_code: string }
	>;
	return {
		headline: {
			line1: toLocalizedString(tr, 'headline_line1'),
			line2: toLocalizedString(tr, 'headline_line2'),
			ariaSuffix: toLocalizedString(tr, 'headline_aria_suffix'),
		},
		subheadline: toLocalizedString(tr, 'subheadline'),
		subtitle: toLocalizedString(tr, 'subtitle'),
		ctaWork: toLocalizedString(tr, 'cta_work'),
		ctaContact: toLocalizedString(tr, 'cta_contact'),
		sqlPanel: {
			prompt: toLocalizedString(tr, 'sql_prompt'),
			liveLabel: toLocalizedString(tr, 'sql_live_label'),
			columns: {
				route: toLocalizedString(tr, 'sql_col_route'),
				avgDelayS: toLocalizedString(tr, 'sql_col_avg_delay'),
				vehicles: toLocalizedString(tr, 'sql_col_vehicles'),
			},
			metaTemplate: toLocalizedString(tr, 'sql_meta_template'),
		},
		refreshButton: {
			label: toLocalizedString(tr, 'refresh_label'),
			helper: toLocalizedString(tr, 'refresh_helper'),
		},
		heroAnim: { scrollDown: toLocalizedString(tr, 'scroll_down') },
	};
}

export async function fetchHeroContent({ client }: FetcherContext): Promise<HeroContent> {
	const result = await client.request(
		readSingleton('block_hero', {
			fields: ['*', { translations: ['*'] } as unknown as string],
		}),
	);
	const row = asSingletonRow<BlockRow>(result, 'fetchHeroContent/block_hero');
	return HeroContentSchema.parse(toHeroContent(row));
}

// ---------------------------------------------------------------------------
// block_manifesto
// ---------------------------------------------------------------------------

export function toManifestoContent(raw: BlockRow): ManifestoContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<
		Record<string, unknown> & { languages_code: string }
	>;
	const statement: ManifestoContent['statement'] = {
		line1: toLocalizedString(tr, 'statement_line1'),
		lineHuge: toLocalizedString(tr, 'statement_line_huge'),
		line3Part1: toLocalizedString(tr, 'statement_line3_part1'),
		line3Highlight: toLocalizedString(tr, 'statement_line3_highlight'),
		line3Part2: toLocalizedString(tr, 'statement_line3_part2'),
	};
	const terminal: ManifestoContent['terminal'] = {
		user: toLocalizedString(tr, 'terminal_user'),
		command: toLocalizedString(tr, 'terminal_command'),
	};
	const edgeLeft: ManifestoContent['edgeLeft'] = {
		sectionNumber: toLocalizedString(tr, 'edge_left_section_number'),
		sectionName: toLocalizedString(tr, 'edge_left_section_name'),
		location: toLocalizedString(tr, 'edge_left_location'),
	};
	const edgeRight: ManifestoContent['edgeRight'] = {
		lat: toLocalizedString(tr, 'edge_right_lat'),
		lng: toLocalizedString(tr, 'edge_right_lng'),
		src: toLocalizedString(tr, 'edge_right_src'),
		via: toLocalizedString(tr, 'edge_right_via'),
		dst: toLocalizedString(tr, 'edge_right_dst'),
		node: toLocalizedString(tr, 'edge_right_node'),
		status: toLocalizedString(tr, 'edge_right_status'),
	};
	const edgeBottom: ManifestoContent['edgeBottom'] = {
		connected: toLocalizedString(tr, 'edge_bottom_connected'),
		line: toLocalizedString(tr, 'edge_bottom_line'),
		url: toLocalizedString(tr, 'edge_bottom_url'),
		version: toLocalizedString(tr, 'edge_bottom_version'),
		scrollHint: toLocalizedString(tr, 'edge_bottom_scroll_hint'),
	};
	const transit: ManifestoContent['transit'] = {
		arrivalLabel: toLocalizedString(tr, 'transit_arrival_label'),
		platformBadge: toLocalizedString(tr, 'transit_platform_badge'),
		directionBadge: toLocalizedString(tr, 'transit_direction_badge'),
	};
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
	const result = await client.request(
		readSingleton('block_manifesto', {
			fields: ['*', { translations: ['*'] } as unknown as string],
		}),
	);
	const row = asSingletonRow<BlockRow>(result, 'fetchManifestoContent/block_manifesto');
	return ManifestoContentSchema.parse(toManifestoContent(row));
}

// ---------------------------------------------------------------------------
// block_proof_reel
// ---------------------------------------------------------------------------

export function toProofReelContent(raw: BlockRow): ProofReelContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	return {
		heading: toLocalizedString(tr, 'heading'),
		headingDot: toLocalizedString(tr, 'heading_dot'),
		subheading: toLocalizedString(tr, 'subheading'),
		sectionLabel: toLocalizedString(tr, 'section_label'),
		viewAllLabel: toLocalizedString(tr, 'view_all_label'),
		viewAllHref: typeof raw.view_all_href === 'string' ? raw.view_all_href : '/work',
		toggleColorAria: toLocalizedString(tr, 'toggle_color_aria'),
	};
}

export async function fetchProofReelContent({ client }: FetcherContext): Promise<ProofReelContent> {
	const result = await client.request(
		readSingleton('block_proof_reel', {
			fields: ['*', { translations: ['*'] } as unknown as string],
		}),
	);
	const row = asSingletonRow<BlockRow>(result, 'fetchProofReelContent/block_proof_reel');
	return ProofReelContentSchema.parse(toProofReelContent(row));
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
	const result = await client.request(
		readSingleton('block_services_grid', {
			fields: ['*', { translations: ['*'] } as unknown as string],
		}),
	);
	const row = asSingletonRow<BlockRow>(result, 'fetchServicesGridContent/block_services_grid');
	return ServicesGridContentSchema.parse(toServicesGridContent(row));
}

// ---------------------------------------------------------------------------
// block_about_intro
// ---------------------------------------------------------------------------

export function toAboutIntroContent(raw: BlockRow): AboutIntroContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<
		Record<string, unknown> & { languages_code: string }
	>;
	const stackItems = Array.isArray(raw.stack_items) ? (raw.stack_items as string[]) : [];
	return {
		name: toLocalizedString(tr, 'name'),
		title: toLocalizedString(tr, 'title'),
		bio: toLocalizedString(tr, 'bio'),
		moreLink: toLocalizedString(tr, 'more_link'),
		stackLabel: toLocalizedString(tr, 'stack_label'),
		stackItems,
		locationLabel: toLocalizedString(tr, 'location_label'),
		location: {
			city: toLocalizedString(tr, 'location_city'),
			region: toLocalizedString(tr, 'location_region'),
		},
		interestsLabel: toLocalizedString(tr, 'interests_label'),
		interests: toLocalizedString(tr, 'interests'),
	};
}

export async function fetchAboutIntroContent({
	client,
}: FetcherContext): Promise<AboutIntroContent> {
	const result = await client.request(
		readSingleton('block_about_intro', {
			fields: ['*', { translations: ['*'] } as unknown as string],
		}),
	);
	const row = asSingletonRow<BlockRow>(result, 'fetchAboutIntroContent/block_about_intro');
	return AboutIntroContentSchema.parse(toAboutIntroContent(row));
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
	const result = await client.request(
		readSingleton('block_cta', {
			fields: ['*', { translations: ['*'] } as unknown as string],
		}),
	);
	const row = asSingletonRow<BlockRow>(result, 'fetchCtaContent/block_cta');
	return CtaContentSchema.parse(toCtaContent(row));
}

// ---------------------------------------------------------------------------
// block_closer
// ---------------------------------------------------------------------------

export function toCloserContent(raw: BlockRow): CloserContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<
		Record<string, unknown> & { languages_code: string }
	>;
	const rowGroup = (key: 'contact' | 'connect' | 'about') => ({
		label: toLocalizedString(tr, `rows_${key}_label`),
		description: toLocalizedString(tr, `rows_${key}_description`),
		action: toLocalizedString(tr, `rows_${key}_action`),
	});
	return {
		heading: toLocalizedString(tr, 'heading'),
		headingDot: toLocalizedString(tr, 'heading_dot'),
		subheading: toLocalizedString(tr, 'subheading'),
		cta: {
			label: toLocalizedString(tr, 'cta_label'),
			href: typeof raw.cta_href === 'string' ? raw.cta_href : '/contact',
		},
		rows: {
			contact: rowGroup('contact'),
			connect: rowGroup('connect'),
			read: {
				label: toLocalizedString(tr, 'rows_read_label'),
				action: toLocalizedString(tr, 'rows_read_action'),
			},
			about: rowGroup('about'),
		},
		attribution: {
			text: toLocalizedString(tr, 'attribution_text'),
			url: typeof raw.attribution_url === 'string' ? raw.attribution_url : '',
		},
		terminal: {
			title: toLocalizedString(tr, 'terminal_title'),
			city: toLocalizedString(tr, 'terminal_city'),
			encoding: toLocalizedString(tr, 'terminal_encoding'),
			destinationsLabel: toLocalizedString(tr, 'terminal_destinations_label'),
			prompt: toLocalizedString(tr, 'terminal_prompt'),
		},
	};
}

export async function fetchCloserContent({ client }: FetcherContext): Promise<CloserContent> {
	const result = await client.request(
		readSingleton('block_closer', {
			fields: ['*', { translations: ['*'] } as unknown as string],
		}),
	);
	const row = asSingletonRow<BlockRow>(result, 'fetchCloserContent/block_closer');
	return CloserContentSchema.parse(toCloserContent(row));
}
