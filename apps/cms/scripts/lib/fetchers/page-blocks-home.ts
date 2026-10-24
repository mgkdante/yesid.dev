/**
 * Home-page block fetchers — 7 blocks under pages('home'):
 *   hero, manifesto, proof-reel, services-grid, about-intro, cta, closer
 *
 * Each block is queried directly via `fetchBlockSingleton` rather than through
 * the admin-grouping-only pages M2A tree. These fetchers own the build-time
 * block projections; generated-content verification catches output drift.
 */

import { str, toLocalizedFields, toLocalizedString } from '../locale';
import { fetchBlockSingleton, type BlockRow } from './singleton';
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

// ---------------------------------------------------------------------------
// block_hero
// ---------------------------------------------------------------------------

export function toHeroContent(raw: BlockRow): HeroContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<
		Record<string, unknown> & { languages_code: string }
	>;
	return {
		headline: toLocalizedFields(tr, [
			['line1', 'headline_line1'], ['line2', 'headline_line2'],
			['ariaSuffix', 'headline_aria_suffix'],
		]),
		...toLocalizedFields(tr, [
			'subheadline', 'subtitle', ['identity', 'identity_line'],
			['ctaWork', 'cta_work'], ['ctaContact', 'cta_contact'],
		]),
		sqlPanel: {
			...toLocalizedFields(tr, [
				['prompt', 'sql_prompt'], ['liveLabel', 'sql_live_label'],
				['liveBadge', 'sql_live_badge'],
			]),
			columns: toLocalizedFields(tr, [
				['route', 'sql_col_route'], ['avgDelayS', 'sql_col_avg_delay'],
				['vehicles', 'sql_col_vehicles'],
			]),
			...toLocalizedFields(tr, [['metaTemplate', 'sql_meta_template']]),
		},
		refreshButton: toLocalizedFields(tr, [
			['label', 'refresh_label'], ['helper', 'refresh_helper'],
			['helperLive', 'refresh_helper_live'],
		]),
		heroAnim: toLocalizedFields(tr, [['scrollDown', 'scroll_down']]),
	};
}

export async function fetchHeroContent({ client }: FetcherContext): Promise<HeroContent> {
	const row = await fetchBlockSingleton(client, 'block_hero', 'fetchHeroContent/block_hero');
	return HeroContentSchema.parse(toHeroContent(row));
}

// ---------------------------------------------------------------------------
// block_manifesto
// ---------------------------------------------------------------------------

export function toManifestoContent(raw: BlockRow): ManifestoContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<
		Record<string, unknown> & { languages_code: string }
	>;
	const statement: ManifestoContent['statement'] = toLocalizedFields(tr, [
		['line1', 'statement_line1'], ['lineHuge', 'statement_line_huge'],
		['line3Part1', 'statement_line3_part1'], ['line3Highlight', 'statement_line3_highlight'],
		['line3Part2', 'statement_line3_part2'],
	]);
	const terminal: ManifestoContent['terminal'] = toLocalizedFields(tr, [
		['user', 'terminal_user'], ['command', 'terminal_command'],
	]);
	const edgeLeft: ManifestoContent['edgeLeft'] = toLocalizedFields(tr, [
		['sectionNumber', 'edge_left_section_number'], ['sectionName', 'edge_left_section_name'],
		['location', 'edge_left_location'],
	]);
	const edgeRight: ManifestoContent['edgeRight'] = toLocalizedFields(tr, [
		['lat', 'edge_right_lat'], ['lng', 'edge_right_lng'], ['src', 'edge_right_src'],
		['via', 'edge_right_via'], ['dst', 'edge_right_dst'], ['node', 'edge_right_node'],
		['status', 'edge_right_status'],
	]);
	const edgeBottom: ManifestoContent['edgeBottom'] = toLocalizedFields(tr, [
		['connected', 'edge_bottom_connected'], ['line', 'edge_bottom_line'],
		['url', 'edge_bottom_url'], ['version', 'edge_bottom_version'],
		['scrollHint', 'edge_bottom_scroll_hint'],
	]);
	const transit: ManifestoContent['transit'] = toLocalizedFields(tr, [
		['arrivalLabel', 'transit_arrival_label'], ['platformBadge', 'transit_platform_badge'],
		['directionBadge', 'transit_direction_badge'],
	]);
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
			en: str(enPill.label),
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
			serviceId: str(enPill.serviceId),
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
			en: str(enLine.name),
		};
		const frLine = htlByLocale.get('fr')?.[idx];
		if (frLine && typeof frLine.name === 'string' && frLine.name.length > 0) {
			nameLS.fr = frLine.name;
		}
		const esLine = htlByLocale.get('es')?.[idx];
		if (esLine && typeof esLine.name === 'string' && esLine.name.length > 0) {
			nameLS.es = esLine.name;
		}
		const color = str(enLine.color);
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
	const row = await fetchBlockSingleton(
		client,
		'block_manifesto',
		'fetchManifestoContent/block_manifesto',
	);
	return ManifestoContentSchema.parse(toManifestoContent(row));
}

// ---------------------------------------------------------------------------
// block_proof_reel
// ---------------------------------------------------------------------------

export function toProofReelContent(raw: BlockRow): ProofReelContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<
		Record<string, unknown> & { languages_code: string }
	>;
	return {
		...toLocalizedFields(tr, [
			'heading', ['headingDot', 'heading_dot'], 'subheading', ['sectionLabel', 'section_label'],
			['viewAllLabel', 'view_all_label'],
		]),
		viewAllHref: typeof raw.view_all_href === 'string' ? raw.view_all_href : '/work',
		...toLocalizedFields(tr, [['toggleColorAria', 'toggle_color_aria']]),
	};
}

export async function fetchProofReelContent({ client }: FetcherContext): Promise<ProofReelContent> {
	const row = await fetchBlockSingleton(
		client,
		'block_proof_reel',
		'fetchProofReelContent/block_proof_reel',
	);
	return ProofReelContentSchema.parse(toProofReelContent(row));
}

// ---------------------------------------------------------------------------
// block_services_grid
// ---------------------------------------------------------------------------

export function toServicesGridContent(raw: BlockRow): ServicesGridContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<
		Record<string, unknown> & { languages_code: string }
	>;
	return toLocalizedFields(tr, [
		'heading', ['headingDot', 'heading_dot'], 'subheading',
		['viewIllustrationAria', 'view_illustration_aria'],
		['viewAllLink', 'view_all_link'],
	]);
}

export async function fetchServicesGridContent({
	client,
}: FetcherContext): Promise<ServicesGridContent> {
	const row = await fetchBlockSingleton(
		client,
		'block_services_grid',
		'fetchServicesGridContent/block_services_grid',
	);
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
		...toLocalizedFields(tr, [
			'name', 'title', 'bio', ['moreLink', 'more_link'],
			['stackLabel', 'stack_label'],
		]),
		stackItems,
		...toLocalizedFields(tr, [['locationLabel', 'location_label']]),
		location: toLocalizedFields(tr, [
			['city', 'location_city'], ['region', 'location_region'],
		]),
		...toLocalizedFields(tr, [['interestsLabel', 'interests_label'], 'interests']),
	};
}

export async function fetchAboutIntroContent({
	client,
}: FetcherContext): Promise<AboutIntroContent> {
	const row = await fetchBlockSingleton(
		client,
		'block_about_intro',
		'fetchAboutIntroContent/block_about_intro',
	);
	return AboutIntroContentSchema.parse(toAboutIntroContent(row));
}

// ---------------------------------------------------------------------------
// block_cta
// ---------------------------------------------------------------------------

export function toCtaContent(raw: BlockRow): CtaContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<
		Record<string, unknown> & { languages_code: string }
	>;
	return toLocalizedFields(tr, [
		'heading', 'subtitle', ['ctaContact', 'cta_contact'], ['ctaGithub', 'cta_github'],
	]);
}

export async function fetchCtaContent({ client }: FetcherContext): Promise<CtaContent> {
	const row = await fetchBlockSingleton(client, 'block_cta', 'fetchCtaContent/block_cta');
	return CtaContentSchema.parse(toCtaContent(row));
}

// ---------------------------------------------------------------------------
// block_closer
// ---------------------------------------------------------------------------

export function toCloserContent(raw: BlockRow): CloserContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<
		Record<string, unknown> & { languages_code: string }
	>;
	const rowGroup = (key: 'stack' | 'contact' | 'connect' | 'read' | 'about') => ({
		label: toLocalizedString(tr, `rows_${key}_label`),
		description: toLocalizedString(tr, `rows_${key}_description`),
		action: toLocalizedString(tr, `rows_${key}_action`),
	});
	return {
		...toLocalizedFields(tr, ['heading', ['headingDot', 'heading_dot'], 'subheading']),
		cta: {
			...toLocalizedFields(tr, [['label', 'cta_label']]),
			href: typeof raw.cta_href === 'string' ? raw.cta_href : '/contact',
		},
		rows: {
			stack: rowGroup('stack'),
			contact: rowGroup('contact'),
			connect: rowGroup('connect'),
			read: rowGroup('read'),
			about: rowGroup('about'),
		},
		attribution: {
			...toLocalizedFields(tr, [['text', 'attribution_text']]),
			url: str(raw.attribution_url),
		},
		terminal: toLocalizedFields(tr, [
			['title', 'terminal_title'], ['city', 'terminal_city'], ['encoding', 'terminal_encoding'],
			['destinationsLabel', 'terminal_destinations_label'],
			['prompt', 'terminal_prompt'],
		]),
	};
}

export async function fetchCloserContent({ client }: FetcherContext): Promise<CloserContent> {
	const row = await fetchBlockSingleton(client, 'block_closer', 'fetchCloserContent/block_closer');
	return CloserContentSchema.parse(toCloserContent(row));
}
