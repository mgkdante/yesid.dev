#!/usr/bin/env bun

import { isDeepStrictEqual } from 'node:util';
import consentFieldSnapshot from '../directus/snapshot/fields/site_labels_translations/ui_analytics_consent_description.json' with {
	type: 'json',
};
import labelsEn from '../fixtures/content/site-labels.json' with { type: 'json' };
import labelsEs from '../fixtures/content/site-labels.es.json' with { type: 'json' };
import labelsFr from '../fixtures/content/site-labels.fr.json' with { type: 'json' };
import legalDrafts from '../ops/legal/legal-pages-2026-07-09.json' with { type: 'json' };
import { getAdminToken } from './lib/auth';
import { parseProductionWriteCli } from './lib/prod-gate';
import { type ApplyContext, rest } from './lib/schema-apply';
import { toBlockEditorDoc } from './seed-legal-pages';

export const TARGET_URLS = {
	dev: 'https://cms.dev.yesid.dev',
	prod: 'https://cms.yesid.dev',
} as const;
export const PROD_CONFIRMATION = 'APPLY_PROD_LEAN_HIGH_INTENT_ANALYTICS';
export const FIELD_PATH =
	'/fields/site_labels_translations/ui_analytics_consent_description';
export const LABELS_PATH =
	'/items/site_labels_translations?fields=id,languages_code,ui_analytics_consent_description&filter[languages_code][_in]=en,fr,es&sort=languages_code&limit=-1';
export const LEGAL_PATH =
	'/items/legal_pages_translations?fields=id,languages_code,legal_pages_id,body&filter[legal_pages_id][_in]=privacy,cookies&filter[languages_code][_in]=en,fr,es&sort=legal_pages_id,languages_code&limit=-1';
export const DESIRED_MAX_LENGTH = 500;
export const MAX_SCHEMA_PATCHES = 1;
export const MAX_CONTENT_PATCHES = 9;

export const LOCALES = ['en', 'fr', 'es'] as const;
export const LEGAL_SLUGS = ['privacy', 'cookies'] as const;

export type Target = keyof typeof TARGET_URLS;
export type Locale = (typeof LOCALES)[number];
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export interface CliOptions {
	target: Target;
	apply: boolean;
}

export function parseCli(argv: readonly string[]): CliOptions {
	return parseProductionWriteCli(
		argv,
		'lean-high-intent-analytics',
		PROD_CONFIRMATION,
	);
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

export interface FieldDefinition {
	collection: string;
	field: string;
	type: string;
	meta: Record<string, unknown>;
	schema: Record<string, unknown> & { max_length: number };
}

export interface LabelRow {
	id: string | number;
	languages_code: Locale;
	ui_analytics_consent_description: string;
}

export interface LegalRow {
	id: string | number;
	languages_code: Locale;
	legal_pages_id: LegalSlug;
	body: EditorDoc | string;
}

export interface LiveSnapshot {
	field: FieldDefinition;
	labels: LabelRow[];
	legal: LegalRow[];
}

export interface SchemaPatch {
	kind: 'schema';
	method: 'PATCH';
	path: typeof FIELD_PATH;
	body: { schema: { max_length: typeof DESIRED_MAX_LENGTH } };
}

export interface LabelPatch {
	kind: 'label';
	method: 'PATCH';
	locale: Locale;
	rowId: string | number;
	path: string;
	before: string;
	body: { ui_analytics_consent_description: string };
}

export interface LegalPatch {
	kind: 'legal';
	method: 'PATCH';
	locale: Locale;
	slug: LegalSlug;
	rowId: string | number;
	path: string;
	before: EditorDoc;
	body: { body: EditorDoc };
}

export type ReconciliationPatch = SchemaPatch | LabelPatch | LegalPatch;

const LEGAL_RULES: Record<
	LegalSlug,
	{ blockCount: number; allowedPaths: readonly string[] }
> = {
	privacy: {
		blockCount: 45,
		allowedPaths: [
			'blocks[1].data.text',
			'blocks[7].data.text',
			'blocks[15].data.text',
			'blocks[17].data.text',
			'blocks[26].data.items[2].content',
			'blocks[26].data.items[3].content',
		],
	},
	cookies: {
		blockCount: 14,
		allowedPaths: [
			'blocks[0].data.text',
			'blocks[2].data.items[1].content',
			'blocks[2].data.items[2].content',
			'blocks[4].data.text',
			'blocks[6].data.text',
			'blocks[8].data.text',
			'blocks[9].data.text',
		],
	},
};

const LABEL_SOURCES: Record<Locale, Record<string, unknown>> = {
	en: labelsEn,
	fr: labelsFr,
	es: labelsEs,
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(value: unknown, label: string): unknown {
	if (typeof value !== 'string') return value;
	try {
		return JSON.parse(value);
	} catch {
		throw new Error(`[lean-high-intent-analytics] malformed JSON for ${label}`);
	}
}

function clone<T>(value: T): T {
	return structuredClone(value);
}

export function desiredConsentDescription(locale: Locale): string {
	const value = LABEL_SOURCES[locale].ui_analytics_consent_description;
	if (typeof value !== 'string' || value.length === 0) {
		throw new Error(
			`[lean-high-intent-analytics] missing approved ${locale} consent description`,
		);
	}
	return value;
}

export function desiredLegalDoc(slug: LegalSlug, locale: Locale): EditorDoc {
	const page = (legalDrafts.pages as DraftPage[]).find(
		(candidate) => candidate.slug === slug,
	);
	if (!page) {
		throw new Error(`[lean-high-intent-analytics] missing legal draft ${slug}`);
	}
	const localeDraft = page[locale];
	const doc = toBlockEditorDoc(slug, locale, localeDraft.blocks) as EditorDoc;
	const expected = LEGAL_RULES[slug].blockCount;
	if (doc.blocks.length !== expected) {
		throw new Error(
			`[lean-high-intent-analytics] ${slug}.${locale} source must have ${expected} blocks`,
		);
	}
	return doc;
}

export function parseLegalBody(value: unknown, label: string): EditorDoc {
	const parsed = parseJson(value, label);
	if (!isRecord(parsed)) {
		throw new Error(`[lean-high-intent-analytics] ${label} body must be an object`);
	}
	if (
		typeof parsed.time !== 'number' ||
		typeof parsed.version !== 'string' ||
		!Array.isArray(parsed.blocks)
	) {
		throw new Error(`[lean-high-intent-analytics] ${label} has invalid editor document`);
	}
	for (const [index, block] of parsed.blocks.entries()) {
		if (
			!isRecord(block) ||
			typeof block.id !== 'string' ||
			typeof block.type !== 'string' ||
			!isRecord(block.data)
		) {
			throw new Error(
				`[lean-high-intent-analytics] ${label} block ${index} is malformed`,
			);
		}
	}
	return parsed as unknown as EditorDoc;
}

function diffPaths(left: unknown, right: unknown, path = ''): string[] {
	if (isDeepStrictEqual(left, right)) return [];
	if (Array.isArray(left) && Array.isArray(right)) {
		const paths: string[] = [];
		for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
			const next = `${path}[${index}]`;
			if (index >= left.length || index >= right.length) paths.push(next);
			else paths.push(...diffPaths(left[index], right[index], next));
		}
		return paths;
	}
	if (isRecord(left) && isRecord(right)) {
		const paths: string[] = [];
		const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
		for (const key of keys) {
			const next = path ? `${path}.${key}` : key;
			if (!(key in left) || !(key in right)) paths.push(next);
			else paths.push(...diffPaths(left[key], right[key], next));
		}
		return paths;
	}
	return [path || '<root>'];
}

function assertFieldShape(field: FieldDefinition): number {
	if (!isRecord(field) || !isRecord(field.meta) || !isRecord(field.schema)) {
		throw new Error('[lean-high-intent-analytics] malformed field definition');
	}
	const maxLength = field.schema.max_length;
	if (maxLength !== 255 && maxLength !== DESIRED_MAX_LENGTH) {
		throw new Error(
			`[lean-high-intent-analytics] unexpected field max_length ${String(maxLength)}`,
		);
	}
	const actual = clone(field) as unknown as Record<string, unknown>;
	const actualMeta = actual.meta as Record<string, unknown>;
	const actualSchema = actual.schema as Record<string, unknown>;
	delete actualMeta.id;
	delete actualSchema.comment;
	delete actualSchema.foreign_key_schema;
	const expected = clone(consentFieldSnapshot) as unknown as Record<string, unknown>;
	(expected.schema as Record<string, unknown>).max_length = maxLength;
	if (!isDeepStrictEqual(actual, expected)) {
		throw new Error(
			'[lean-high-intent-analytics] consent field has unrelated schema or interface drift',
		);
	}
	return maxLength;
}

function assertExactRows<T>(
	rows: readonly T[],
	expected: number,
	label: string,
): void {
	if (rows.length !== expected) {
		throw new Error(
			`[lean-high-intent-analytics] expected exactly ${expected} ${label} rows, received ${rows.length}`,
		);
	}
	const ids: number[] = [];
	for (const row of rows) {
		if (
			!isRecord(row) ||
			typeof row.id !== 'number' ||
			!Number.isSafeInteger(row.id) ||
			row.id <= 0
		) {
			throw new Error(`[lean-high-intent-analytics] invalid ${label} row id`);
		}
		ids.push(row.id);
	}
	if (new Set(ids).size !== ids.length) {
		throw new Error(`[lean-high-intent-analytics] duplicate ${label} row id`);
	}
}

function labelRowsByLocale(rows: readonly LabelRow[]): Map<Locale, LabelRow> {
	assertExactRows(rows, LOCALES.length, 'consent-label');
	const byLocale = new Map<Locale, LabelRow>();
	for (const row of rows) {
		if (!LOCALES.includes(row.languages_code) || byLocale.has(row.languages_code)) {
			throw new Error(
				`[lean-high-intent-analytics] duplicate or unexpected consent locale ${String(row.languages_code)}`,
			);
		}
		if (typeof row.ui_analytics_consent_description !== 'string') {
			throw new Error(
				`[lean-high-intent-analytics] ${row.languages_code} consent description must be a string`,
			);
		}
		byLocale.set(row.languages_code, row);
	}
	for (const locale of LOCALES) {
		if (!byLocale.has(locale)) {
			throw new Error(`[lean-high-intent-analytics] missing consent locale ${locale}`);
		}
	}
	return byLocale;
}

function legalRowsByKey(rows: readonly LegalRow[]): Map<string, LegalRow> {
	assertExactRows(rows, LOCALES.length * LEGAL_SLUGS.length, 'legal');
	const byKey = new Map<string, LegalRow>();
	for (const row of rows) {
		if (
			!LOCALES.includes(row.languages_code) ||
			!LEGAL_SLUGS.includes(row.legal_pages_id)
		) {
			throw new Error(
				`[lean-high-intent-analytics] unexpected legal row ${String(row.legal_pages_id)}.${String(row.languages_code)}`,
			);
		}
		const key = `${row.legal_pages_id}.${row.languages_code}`;
		if (byKey.has(key)) {
			throw new Error(`[lean-high-intent-analytics] duplicate legal row ${key}`);
		}
		byKey.set(key, row);
	}
	for (const slug of LEGAL_SLUGS) {
		for (const locale of LOCALES) {
			const key = `${slug}.${locale}`;
			if (!byKey.has(key)) {
				throw new Error(`[lean-high-intent-analytics] missing legal row ${key}`);
			}
		}
	}
	return byKey;
}

export function assertPlanCaps(plan: readonly ReconciliationPatch[]): void {
	const schemaCount = plan.filter((step) => step.kind === 'schema').length;
	const contentCount = plan.length - schemaCount;
	if (schemaCount > MAX_SCHEMA_PATCHES || contentCount > MAX_CONTENT_PATCHES) {
		throw new Error(
			`[lean-high-intent-analytics] patch cap exceeded (${schemaCount} schema, ${contentCount} content)`,
		);
	}
}

export function buildPlan(snapshot: LiveSnapshot): ReconciliationPatch[] {
	const plan: ReconciliationPatch[] = [];
	if (assertFieldShape(snapshot.field) === 255) {
		plan.push({
			kind: 'schema',
			method: 'PATCH',
			path: FIELD_PATH,
			body: { schema: { max_length: DESIRED_MAX_LENGTH } },
		});
	}

	const labels = labelRowsByLocale(snapshot.labels);
	for (const locale of LOCALES) {
		const row = labels.get(locale)!;
		const desired = desiredConsentDescription(locale);
		if (row.ui_analytics_consent_description !== desired) {
			plan.push({
				kind: 'label',
				method: 'PATCH',
				locale,
				rowId: row.id,
				path: `/items/site_labels_translations/${encodeURIComponent(String(row.id))}`,
				before: row.ui_analytics_consent_description,
				body: { ui_analytics_consent_description: desired },
			});
		}
	}

	const legal = legalRowsByKey(snapshot.legal);
	for (const slug of LEGAL_SLUGS) {
		for (const locale of LOCALES) {
			const key = `${slug}.${locale}`;
			const row = legal.get(key)!;
			const current = parseLegalBody(row.body, key);
			const desired = desiredLegalDoc(slug, locale);
			const rule = LEGAL_RULES[slug];
			if (current.blocks.length !== rule.blockCount) {
				throw new Error(
					`[lean-high-intent-analytics] ${key} must have ${rule.blockCount} blocks`,
				);
			}
			const differences = diffPaths(current, desired);
			const allowed = new Set(rule.allowedPaths);
			const unexpected = differences.filter((path) => !allowed.has(path));
			if (unexpected.length > 0) {
				throw new Error(
					`[lean-high-intent-analytics] unrelated legal drift in ${key}: ${unexpected.join(', ')}`,
				);
			}
			if (differences.length > 0) {
				plan.push({
					kind: 'legal',
					method: 'PATCH',
					slug,
					locale,
					rowId: row.id,
					path: `/items/legal_pages_translations/${encodeURIComponent(String(row.id))}`,
					before: current,
					body: { body: desired },
				});
			}
		}
	}
	assertPlanCaps(plan);
	return plan;
}

export function formatPlan(plan: readonly ReconciliationPatch[]): string {
	assertPlanCaps(plan);
	if (plan.length === 0) return 'NO CHANGES';
	const schemaCount = plan.filter((step) => step.kind === 'schema').length;
	const contentCount = plan.length - schemaCount;
	return [
		`LEAN HIGH-INTENT ANALYTICS: ${schemaCount} schema + ${contentCount} content PATCHes`,
		...plan.map((step) => {
			if (step.kind === 'schema') {
				return `  PATCH ${step.path} -> schema.max_length=${DESIRED_MAX_LENGTH}`;
			}
			if (step.kind === 'label') {
				return `  PATCH ${step.path} -> ${step.locale} consent description (${step.body.ui_analytics_consent_description.length} chars)`;
			}
			return `  PATCH ${step.path} -> ${step.slug}.${step.locale} approved Editor document`;
		}),
	].join('\n');
}

export interface AnalyticsCms {
	read(): Promise<LiveSnapshot>;
	readLegal(rowId: string | number): Promise<LegalRow>;
	patch(step: ReconciliationPatch): Promise<void>;
}

function samePlan(
	left: readonly ReconciliationPatch[],
	right: readonly ReconciliationPatch[],
): boolean {
	return isDeepStrictEqual(left, right);
}

export async function applyAndVerify(
	cms: AnalyticsCms,
	displayedPlan: readonly ReconciliationPatch[],
): Promise<readonly ReconciliationPatch[]> {
	assertPlanCaps(displayedPlan);
	const currentPlan = buildPlan(await cms.read());
	if (!samePlan(currentPlan, displayedPlan)) {
		throw new Error('[lean-high-intent-analytics] state changed before apply');
	}
	if (displayedPlan.length === 0) return [];

	for (const step of displayedPlan.filter((candidate) => candidate.kind === 'schema')) {
		await cms.patch(step);
	}
	for (const step of displayedPlan.filter((candidate) => candidate.kind !== 'schema')) {
		if (step.kind === 'legal') {
			const fresh = await cms.readLegal(step.rowId);
			if (
				String(fresh.id) !== String(step.rowId) ||
				fresh.languages_code !== step.locale ||
				fresh.legal_pages_id !== step.slug ||
				!isDeepStrictEqual(
					parseLegalBody(fresh.body, `${step.slug}.${step.locale} pre-patch`),
					step.before,
				)
			) {
				throw new Error(
					`[lean-high-intent-analytics] ${step.slug}.${step.locale} changed before PATCH`,
				);
			}
		}
		await cms.patch(step);
	}

	const remaining = buildPlan(await cms.read());
	if (remaining.length !== 0) {
		throw new Error(
			`[lean-high-intent-analytics] post-apply verification failed: ${remaining.length} patches remain`,
		);
	}
	return displayedPlan;
}

type RestResponse = { status: number; json: unknown };
export type RestRequest = (
	ctx: ApplyContext,
	method: string,
	path: string,
	body?: unknown,
) => Promise<RestResponse>;

function responseData(response: RestResponse, label: string): unknown {
	if (response.status >= 400) {
		throw new Error(
			`[lean-high-intent-analytics] ${label} failed (${response.status})`,
		);
	}
	const json = parseJson(response.json, `${label} response`);
	if (!isRecord(json) || !('data' in json)) {
		throw new Error(`[lean-high-intent-analytics] malformed ${label} response`);
	}
	return parseJson(json.data, `${label} data`);
}

export function createAnalyticsCms(
	ctx: ApplyContext,
	request: RestRequest = rest,
): AnalyticsCms {
	const get = async (path: string, label: string) =>
		responseData(await request(ctx, 'GET', path), label);
	return {
		read: async () => {
			const field = await get(FIELD_PATH, 'field read');
			const labels = await get(LABELS_PATH, 'consent-label read');
			const legal = await get(LEGAL_PATH, 'legal read');
			if (!isRecord(field) || !Array.isArray(labels) || !Array.isArray(legal)) {
				throw new Error('[lean-high-intent-analytics] malformed live snapshot');
			}
			return {
				field: field as unknown as FieldDefinition,
				labels: labels as LabelRow[],
				legal: legal as LegalRow[],
			};
		},
		readLegal: async (rowId) => {
			const path = `/items/legal_pages_translations/${encodeURIComponent(String(rowId))}?fields=id,languages_code,legal_pages_id,body`;
			const row = await get(path, `legal row ${String(rowId)} read`);
			if (!isRecord(row)) {
				throw new Error(
					`[lean-high-intent-analytics] malformed legal row ${String(rowId)}`,
				);
			}
			return row as unknown as LegalRow;
		},
		patch: async (step) => {
			const response = await request(ctx, step.method, step.path, step.body);
			if (response.status >= 400) {
				throw new Error(
					`[lean-high-intent-analytics] PATCH ${step.path} failed (${response.status})`,
				);
			}
		},
	};
}

export async function runReconciliation(
	cms: AnalyticsCms,
	apply: boolean,
	output: (line: string) => void = (line) => console.log(line),
): Promise<readonly ReconciliationPatch[]> {
	const displayedPlan = buildPlan(await cms.read());
	output(formatPlan(displayedPlan));
	if (apply) await applyAndVerify(cms, displayedPlan);
	return displayedPlan;
}

async function main(): Promise<void> {
	const options = parseCli(process.argv.slice(2));
	const url = TARGET_URLS[options.target];
	console.log(
		`[lean-high-intent-analytics] target=${options.target} url=${url} mode=${options.apply ? 'APPLY' : 'DRY-RUN'}`,
	);
	const token = await getAdminToken(url, { allowBuildToken: false });
	const cms = createAnalyticsCms({ directusUrl: url, token });
	const displayedPlan = await runReconciliation(cms, options.apply);
	if (!options.apply) {
		console.log('[lean-high-intent-analytics] dry-run complete; no writes sent');
		return;
	}
	console.log(
		`[lean-high-intent-analytics] verified ${displayedPlan.length} PATCHes; NO CHANGES remain`,
	);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[lean-high-intent-analytics] FAILED:', error);
		process.exit(1);
	});
}
