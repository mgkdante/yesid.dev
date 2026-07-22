#!/usr/bin/env bun

import { isDeepStrictEqual } from 'node:util';
import legalDrafts from '../ops/legal/legal-pages-2026-07-09.json' with { type: 'json' };
import { getAdminToken } from './lib/auth';
import { parseProductionWriteCli } from './lib/prod-gate';
import { type ApplyContext, rest } from './lib/schema-apply';
import { toBlockEditorDoc } from './seed-legal-pages';

export const TARGET_URLS = {
	dev: 'https://cms.dev.yesid.dev',
	prod: 'https://cms.yesid.dev',
} as const;

export const PROD_CONFIRMATION = 'APPLY_PROD_LEGAL_PUBLIC_CONTACT';
export const LEGAL_PATH =
	'/items/legal_pages_translations?fields=id,languages_code,legal_pages_id,body&filter[legal_pages_id][_in]=privacy,terms,cookies,accessibility,notice&filter[languages_code][_in]=en,fr,es&sort=legal_pages_id,languages_code&limit=-1';
export const LOCALES = ['en', 'fr', 'es'] as const;
export const LEGAL_SLUGS = [
	'privacy',
	'terms',
	'cookies',
	'accessibility',
	'notice',
] as const;
export const PUBLIC_CONTACT_EMAIL = 'contact@yesid.dev';
export const INTERNAL_CONTACT_EMAIL = 'admin@yesid.dev';
export const REVISION_DATES = {
	privacy: '2026-07-15',
	terms: '2026-07-12',
	cookies: '2026-07-15',
	accessibility: '2026-07-12',
	notice: '2026-07-13',
} as const satisfies Record<(typeof LEGAL_SLUGS)[number], string>;
export const MAX_CONTENT_PATCHES = 15;

const PUBLIC_CONTACT_COUNTS: Record<LegalSlug, number> = {
	privacy: 5,
	terms: 1,
	cookies: 1,
	accessibility: 2,
	notice: 1,
};

const PREVIOUS_REVISION_DATES: Record<LegalSlug, string> = {
	privacy: '2026-07-12',
	terms: '2026-07-09',
	cookies: '2026-07-12',
	accessibility: '2026-07-09',
	notice: '2026-07-09',
};

export type Target = keyof typeof TARGET_URLS;
export type Locale = (typeof LOCALES)[number];
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export interface CliOptions {
	target: Target;
	apply: boolean;
}

interface DraftBlock {
	kind: 'h2' | 'h3' | 'p' | 'ul' | 'ol';
	text?: string;
	items?: string[];
}

interface DraftLocale {
	title: string;
	blocks: DraftBlock[];
}

interface DraftPage {
	slug: string;
	en: DraftLocale;
	fr: DraftLocale;
	es: DraftLocale;
}

export interface EditorBlock {
	id: string;
	type: string;
	data: Record<string, unknown>;
}

export interface EditorDoc {
	time: number;
	version: string;
	blocks: EditorBlock[];
}

export interface LegalRow {
	id: string | number;
	languages_code: Locale;
	legal_pages_id: LegalSlug;
	body: EditorDoc | string;
}

export interface LiveSnapshot {
	rows: LegalRow[];
}

export interface LegalPatch {
	kind: 'legal';
	method: 'PATCH';
	locale: Locale;
	slug: LegalSlug;
	rowId: number;
	path: string;
	before: EditorDoc;
	body: { body: EditorDoc };
}

export function parseCli(argv: readonly string[]): CliOptions {
	return parseProductionWriteCli(
		argv,
		'legal-public-contact',
		PROD_CONFIRMATION,
	);
}

function clone<T>(value: T): T {
	return structuredClone(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function countText(doc: EditorDoc, needle: string): number {
	let count = 0;
	for (const block of doc.blocks) {
		const text = block.data.text;
		if (typeof text === 'string') count += text.split(needle).length - 1;
	}
	return count;
}

export function desiredContactDoc(slug: LegalSlug, locale: Locale): EditorDoc {
	const page = (legalDrafts.pages as DraftPage[]).find(
		(candidate) => candidate.slug === slug,
	);
	if (!page) throw new Error(`[legal-public-contact] missing legal source ${slug}`);
	const localeDraft = page[locale];
	if (!localeDraft) {
		throw new Error(`[legal-public-contact] missing legal source ${slug}.${locale}`);
	}
	const doc = toBlockEditorDoc(slug, locale, localeDraft.blocks) as EditorDoc;
	const expectedCount = PUBLIC_CONTACT_COUNTS[slug];
	const revisionDate = REVISION_DATES[slug];
	if (
		countText(doc, PUBLIC_CONTACT_EMAIL) !== expectedCount ||
		countText(doc, INTERNAL_CONTACT_EMAIL) !== 0 ||
		countText(doc, revisionDate) !== 1
	) {
		throw new Error(
			`[legal-public-contact] ${slug}.${locale} source must contain exactly ${expectedCount} public contact addresses, no internal address, and one ${revisionDate} revision date`,
		);
	}
	return doc;
}

export function previousRevisionContactDoc(
	slug: LegalSlug,
	locale: Locale,
): EditorDoc {
	const doc = clone(desiredContactDoc(slug, locale));
	const revisionDate = REVISION_DATES[slug];
	let replacements = 0;
	for (const block of doc.blocks) {
		if (typeof block.data.text === 'string') {
			const count = block.data.text.split(revisionDate).length - 1;
			replacements += count;
			block.data.text = block.data.text.replaceAll(
				revisionDate,
				PREVIOUS_REVISION_DATES[slug],
			);
		}
	}
	if (
		replacements !== 1 ||
		countText(doc, revisionDate) !== 0 ||
		countText(doc, PREVIOUS_REVISION_DATES[slug]) !== 1 ||
		countText(doc, INTERNAL_CONTACT_EMAIL) !== 0
	) {
		throw new Error(
			`[legal-public-contact] failed to derive previous revision ${slug}.${locale}`,
		);
	}
	return doc;
}

export function parseLegalBody(value: unknown, label: string): EditorDoc {
	let parsed = value;
	if (typeof parsed === 'string') {
		try {
			parsed = JSON.parse(parsed);
		} catch {
			throw new Error(`[legal-public-contact] malformed JSON for ${label}`);
		}
	}
	if (
		!isRecord(parsed) ||
		typeof parsed.time !== 'number' ||
		typeof parsed.version !== 'string' ||
		!Array.isArray(parsed.blocks)
	) {
		throw new Error(`[legal-public-contact] malformed editor document for ${label}`);
	}
	for (const [index, block] of parsed.blocks.entries()) {
		if (
			!isRecord(block) ||
			typeof block.id !== 'string' ||
			typeof block.type !== 'string' ||
			!isRecord(block.data)
		) {
			throw new Error(
				`[legal-public-contact] malformed ${label} block ${index}`,
			);
		}
	}
	return parsed as unknown as EditorDoc;
}

function rowsByKey(rows: readonly LegalRow[]): Map<string, LegalRow> {
	if (rows.length !== LOCALES.length * LEGAL_SLUGS.length) {
		throw new Error(
			`[legal-public-contact] expected exactly 15 legal translations, received ${rows.length}`,
		);
	}
	const ids = new Set<number>();
	const byKey = new Map<string, LegalRow>();
	for (const row of rows) {
		if (
			!isRecord(row) ||
			typeof row.id !== 'number' ||
			!Number.isSafeInteger(row.id) ||
			row.id <= 0
		) {
			throw new Error('[legal-public-contact] invalid legal translation row id');
		}
		if (ids.has(row.id)) {
			throw new Error('[legal-public-contact] duplicate legal translation row id');
		}
		ids.add(row.id);
		if (
			!LOCALES.includes(row.languages_code) ||
			!LEGAL_SLUGS.includes(row.legal_pages_id)
		) {
			throw new Error(
				`[legal-public-contact] unexpected legal translation ${String(row.legal_pages_id)}.${String(row.languages_code)}`,
			);
		}
		const key = `${row.legal_pages_id}.${row.languages_code}`;
		if (byKey.has(key)) {
			throw new Error(`[legal-public-contact] duplicate legal translation ${key}`);
		}
		byKey.set(key, row);
	}
	return byKey;
}

export function assertPlanCap(plan: readonly LegalPatch[]): void {
	if (plan.length > MAX_CONTENT_PATCHES) {
		throw new Error(
			`[legal-public-contact] patch cap exceeded (${plan.length} content PATCHes)`,
		);
	}
}

export function buildPlan(snapshot: LiveSnapshot): LegalPatch[] {
	const rows = rowsByKey(snapshot.rows);
	const plan: LegalPatch[] = [];
	for (const slug of LEGAL_SLUGS) {
		for (const locale of LOCALES) {
			const key = `${slug}.${locale}`;
			const row = rows.get(key);
			if (!row) throw new Error(`[legal-public-contact] missing legal translation ${key}`);
			const current = parseLegalBody(row.body, key);
			const desired = desiredContactDoc(slug, locale);
			if (isDeepStrictEqual(current, desired)) continue;
			const previous = previousRevisionContactDoc(slug, locale);
			if (!isDeepStrictEqual(current, previous)) {
				throw new Error(`[legal-public-contact] unrelated public legal drift in ${key}`);
			}
			plan.push({
				kind: 'legal',
				method: 'PATCH',
				locale,
				slug,
				rowId: row.id as number,
				path: `/items/legal_pages_translations/${row.id}`,
				before: current,
				body: { body: desired },
			});
		}
	}
	assertPlanCap(plan);
	return plan;
}

export function formatPlan(plan: readonly LegalPatch[]): string {
	assertPlanCap(plan);
	if (plan.length === 0) return 'NO CHANGES';
	return [
		`LEGAL PUBLIC CONTACT: ${plan.length} content PATCHes`,
		...plan.map(
			(step) =>
				`  PATCH ${step.path} -> ${step.slug}.${step.locale} public legal body revision`,
		),
	].join('\n');
}

export interface LegalContactCms {
	read(): Promise<LiveSnapshot>;
	readLegal(rowId: number): Promise<LegalRow>;
	patch(step: LegalPatch): Promise<void>;
}

function assertFreshLegalRow(row: unknown, step: LegalPatch): void {
	if (
		!isRecord(row) ||
		typeof row.id !== 'number' ||
		!Number.isSafeInteger(row.id) ||
		row.id <= 0 ||
		row.id !== step.rowId ||
		row.legal_pages_id !== step.slug ||
		row.languages_code !== step.locale ||
		!('body' in row)
	) {
		throw new Error(
			`[legal-public-contact] ${step.slug}.${step.locale} changed before PATCH`,
		);
	}
	const body = parseLegalBody(
		row.body,
		`${step.slug}.${step.locale} pre-patch`,
	);
	if (!isDeepStrictEqual(body, step.before)) {
		throw new Error(
			`[legal-public-contact] ${step.slug}.${step.locale} changed before PATCH`,
		);
	}
}

export async function applyAndVerify(
	cms: LegalContactCms,
	displayedPlan: readonly LegalPatch[],
): Promise<readonly LegalPatch[]> {
	assertPlanCap(displayedPlan);
	const currentPlan = buildPlan(await cms.read());
	if (!isDeepStrictEqual(currentPlan, displayedPlan)) {
		throw new Error('[legal-public-contact] state changed before apply');
	}
	if (displayedPlan.length === 0) return [];
	for (const step of displayedPlan) {
		assertFreshLegalRow(await cms.readLegal(step.rowId), step);
		await cms.patch(step);
	}

	const remaining = buildPlan(await cms.read());
	if (remaining.length !== 0) {
		throw new Error(
			`[legal-public-contact] post-apply verification failed: ${remaining.length} patches remain`,
		);
	}
	return displayedPlan;
}

export async function runReconciliation(
	cms: LegalContactCms,
	apply: boolean,
	output: (line: string) => void = (line) => console.log(line),
): Promise<readonly LegalPatch[]> {
	const displayedPlan = buildPlan(await cms.read());
	output(formatPlan(displayedPlan));
	if (apply) await applyAndVerify(cms, displayedPlan);
	return displayedPlan;
}

type RestResponse = { status: number; json: unknown };
export type RestRequest = (
	ctx: ApplyContext,
	method: string,
	path: string,
	body?: unknown,
) => Promise<RestResponse>;

function parseJson(value: unknown, label: string): unknown {
	if (typeof value !== 'string') return value;
	try {
		return JSON.parse(value);
	} catch {
		throw new Error(`[legal-public-contact] malformed JSON for ${label}`);
	}
}

function responseData(response: RestResponse, label: string): unknown {
	if (response.status >= 400) {
		throw new Error(
			`[legal-public-contact] ${label} failed (${response.status})`,
		);
	}
	const json = parseJson(response.json, `${label} response`);
	if (!isRecord(json) || !('data' in json)) {
		throw new Error(`[legal-public-contact] malformed ${label} response`);
	}
	return parseJson(json.data, `${label} data`);
}

export function createLegalContactCms(
	ctx: ApplyContext,
	request: RestRequest = rest,
): LegalContactCms {
	return {
		read: async () => {
			const rows = responseData(
				await request(ctx, 'GET', LEGAL_PATH),
				'legal translation read',
			);
			if (!Array.isArray(rows)) {
				throw new Error('[legal-public-contact] malformed live legal translations');
			}
			return { rows: rows as LegalRow[] };
		},
		readLegal: async (rowId) => {
			const path = `/items/legal_pages_translations/${encodeURIComponent(String(rowId))}?fields=id,languages_code,legal_pages_id,body`;
			const row = responseData(
				await request(ctx, 'GET', path),
				`legal row ${String(rowId)} read`,
			);
			if (!isRecord(row)) {
				throw new Error(
					`[legal-public-contact] malformed legal row ${String(rowId)}`,
				);
			}
			return row as unknown as LegalRow;
		},
		patch: async (step) => {
			const response = await request(ctx, step.method, step.path, step.body);
			if (response.status >= 400) {
				throw new Error(
					`[legal-public-contact] PATCH ${step.path} failed (${response.status})`,
				);
			}
		},
	};
}

async function main(): Promise<void> {
	const options = parseCli(process.argv.slice(2));
	const url = TARGET_URLS[options.target];
	console.log(
		`[legal-public-contact] target=${options.target} url=${url} mode=${options.apply ? 'APPLY' : 'DRY-RUN'}`,
	);
	const token = await getAdminToken(url, { allowBuildToken: false });
	const cms = createLegalContactCms({ directusUrl: url, token });
	const displayedPlan = await runReconciliation(cms, options.apply);
	if (!options.apply) {
		console.log('[legal-public-contact] dry-run complete; no writes sent');
		return;
	}
	console.log(
		`[legal-public-contact] verified ${displayedPlan.length} PATCHes; NO CHANGES remain`,
	);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[legal-public-contact] FAILED:', error);
		process.exit(1);
	});
}
