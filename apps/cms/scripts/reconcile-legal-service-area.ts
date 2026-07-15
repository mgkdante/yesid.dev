#!/usr/bin/env bun

import { createHash } from 'node:crypto';
import { isDeepStrictEqual, parseArgs as parseNodeArgs } from 'node:util';
import { getAdminToken } from './lib/auth';
import { type ApplyContext, rest } from './lib/schema-apply';
import {
	desiredContactDoc,
	type EditorDoc,
	type LegalRow,
	parseLegalBody,
} from './reconcile-legal-public-contact';

export type { EditorDoc } from './reconcile-legal-public-contact';

export const TARGET_URLS = {
	dev: 'https://cms.dev.yesid.dev',
	prod: 'https://cms.yesid.dev',
} as const;

export const PROD_CONFIRMATION = 'APPLY_PROD_LEGAL_SERVICE_AREA';
export const LOCALES = ['en', 'fr', 'es'] as const;
export const LEGAL_PATH =
	'/items/legal_pages_translations?fields=id,languages_code,legal_pages_id,body&filter[legal_pages_id][_eq]=notice&filter[languages_code][_in]=en,fr,es&sort=languages_code&limit=-1';
export const MAX_CONTENT_PATCHES = 3;

export type Target = keyof typeof TARGET_URLS;
export type Locale = (typeof LOCALES)[number];

export const PRE_REMEDIATION_SHA256: Record<Locale, string> = {
	en: 'f316a74023325543f4d732f29bf1091f24b3056d07c6e9efb38e9deee0e3b90a',
	fr: '5c504c1e19cc800bf7328e9c0acddbeeaccc7de6723c49be4f6ab2e67a7165d5',
	es: '3e981259dc65df30e3017f5e70c6d8ad32ac2ee1eb614827f59eebc0a832db79',
};

const SERVICE_AREA_TEXT: Record<Locale, string> = {
	en: 'Service area: Montréal, Québec, Canada.',
	fr: 'Zone de service : Montréal, Québec, Canada.',
	es: 'Área de servicio: Montréal, Québec, Canadá.',
};

const CANADIAN_POSTAL_CODE = /\b[A-Z]\d[A-Z][ -]?\d[A-Z]\d\b/i;

export interface CliOptions {
	target: Target;
	apply: boolean;
}

export interface LiveSnapshot {
	rows: LegalRow[];
}

export interface ServiceAreaPatch {
	kind: 'legal-service-area';
	method: 'PATCH';
	locale: Locale;
	rowId: number;
	path: string;
	before: EditorDoc;
	body: { body: EditorDoc };
}

export interface LegalServiceAreaCms {
	read(): Promise<LiveSnapshot>;
	readLegal(rowId: number): Promise<LegalRow>;
	patch(step: ServiceAreaPatch): Promise<void>;
}

type RestResponse = { status: number; json: unknown };
export type RestRequest = (
	ctx: ApplyContext,
	method: string,
	path: string,
	body?: unknown,
) => Promise<RestResponse>;

export function parseCli(argv: readonly string[]): CliOptions {
	const { values } = parseNodeArgs({
		args: [...argv],
		options: {
			target: { type: 'string' },
			apply: { type: 'boolean', default: false },
			'dry-run': { type: 'boolean', default: false },
			confirm: { type: 'string' },
		},
		strict: true,
		allowPositionals: false,
	});
	if (values.target !== 'dev' && values.target !== 'prod') {
		throw new Error('[legal-service-area] required: --target=dev|prod');
	}
	const apply = values.apply === true;
	if (apply && values['dry-run'] === true) {
		throw new Error('[legal-service-area] choose one: --dry-run or --apply');
	}
	if (values.target === 'prod' && apply) {
		if (values.confirm !== PROD_CONFIRMATION) {
			throw new Error(
				`[legal-service-area] PROD apply requires --confirm=${PROD_CONFIRMATION}`,
			);
		}
	} else if (values.confirm !== undefined) {
		throw new Error('[legal-service-area] --confirm is accepted only for PROD apply');
	}
	return { target: values.target, apply };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function canonicalize(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonicalize);
	if (!isRecord(value)) return value;
	return Object.fromEntries(
		Object.keys(value)
			.sort()
			.map((key) => [key, canonicalize(value[key])]),
	);
}

export function hashEditorDoc(doc: EditorDoc): string {
	return createHash('sha256')
		.update(JSON.stringify(canonicalize(doc)))
		.digest('hex');
}

function collectStrings(value: unknown): string[] {
	if (typeof value === 'string') return [value];
	if (Array.isArray(value)) return value.flatMap(collectStrings);
	if (!isRecord(value)) return [];
	return Object.values(value).flatMap(collectStrings);
}

function textContent(doc: EditorDoc): string {
	return doc.blocks.flatMap((block) => collectStrings(block.data)).join('\n');
}

export function hasPrivateLocation(doc: EditorDoc): boolean {
	const text = textContent(doc);
	return /\bGatineau\b/i.test(text) || CANADIAN_POSTAL_CODE.test(text);
}

export function desiredServiceAreaDoc(locale: Locale): EditorDoc {
	const doc = desiredContactDoc('notice', locale);
	const text = textContent(doc);
	if (
		!text.includes(SERVICE_AREA_TEXT[locale]) ||
		hasPrivateLocation(doc)
	) {
		throw new Error(
			`[legal-service-area] unsafe canonical notice source for notice.${locale}`,
		);
	}
	return doc;
}

function rowsByLocale(rows: readonly LegalRow[]): Map<Locale, LegalRow> {
	if (rows.length !== LOCALES.length) {
		throw new Error(
			`[legal-service-area] expected exactly 3 notice translations, received ${rows.length}`,
		);
	}
	const ids = new Set<number>();
	const byLocale = new Map<Locale, LegalRow>();
	for (const row of rows) {
		if (
			!isRecord(row) ||
			typeof row.id !== 'number' ||
			!Number.isSafeInteger(row.id) ||
			row.id <= 0
		) {
			throw new Error('[legal-service-area] invalid legal translation row id');
		}
		if (ids.has(row.id)) {
			throw new Error('[legal-service-area] duplicate legal translation row id');
		}
		ids.add(row.id);
		if (
			row.legal_pages_id !== 'notice' ||
			!LOCALES.includes(row.languages_code as Locale)
		) {
			throw new Error('[legal-service-area] unexpected legal translation row');
		}
		const locale = row.languages_code as Locale;
		if (byLocale.has(locale)) {
			throw new Error(
				`[legal-service-area] duplicate legal translation notice.${locale}`,
			);
		}
		byLocale.set(locale, row);
	}
	return byLocale;
}

export function assertPlanCap(plan: readonly ServiceAreaPatch[]): void {
	if (plan.length > MAX_CONTENT_PATCHES) {
		throw new Error(
			`[legal-service-area] patch cap exceeded (${plan.length} content PATCHes)`,
		);
	}
}

export function buildPlan(
	snapshot: LiveSnapshot,
	acceptedBeforeHashes: Readonly<Record<Locale, string>> =
		PRE_REMEDIATION_SHA256,
): ServiceAreaPatch[] {
	const rows = rowsByLocale(snapshot.rows);
	const plan: ServiceAreaPatch[] = [];
	for (const locale of LOCALES) {
		const row = rows.get(locale);
		if (!row) {
			throw new Error(`[legal-service-area] missing legal translation notice.${locale}`);
		}
		const current = parseLegalBody(row.body, `notice.${locale}`);
		const desired = desiredServiceAreaDoc(locale);
		if (isDeepStrictEqual(current, desired)) continue;
		if (hashEditorDoc(current) !== acceptedBeforeHashes[locale]) {
			throw new Error(
				`[legal-service-area] unrecognized pre-remediation body hash for notice.${locale}`,
			);
		}
		plan.push({
			kind: 'legal-service-area',
			method: 'PATCH',
			locale,
			rowId: row.id as number,
			path: `/items/legal_pages_translations/${row.id}`,
			before: current,
			body: { body: desired },
		});
	}
	assertPlanCap(plan);
	return plan;
}

export function formatPlan(plan: readonly ServiceAreaPatch[]): string {
	assertPlanCap(plan);
	if (plan.length === 0) return 'NO CHANGES';
	return [
		`LEGAL SERVICE AREA: ${plan.length} content PATCHes`,
		...plan.map(
			(step) =>
				`  PATCH ${step.path} -> notice.${step.locale} service-area identification`,
		),
	].join('\n');
}

function assertFreshLegalRow(row: unknown, step: ServiceAreaPatch): void {
	if (
		!isRecord(row) ||
		row.id !== step.rowId ||
		row.legal_pages_id !== 'notice' ||
		row.languages_code !== step.locale ||
		!('body' in row)
	) {
		throw new Error(
			`[legal-service-area] notice.${step.locale} changed before PATCH`,
		);
	}
	const body = parseLegalBody(
		row.body,
		`notice.${step.locale} pre-patch`,
	);
	if (!isDeepStrictEqual(body, step.before)) {
		throw new Error(
			`[legal-service-area] notice.${step.locale} changed before PATCH`,
		);
	}
}

export async function applyAndVerify(
	cms: LegalServiceAreaCms,
	displayedPlan: readonly ServiceAreaPatch[],
	acceptedBeforeHashes: Readonly<Record<Locale, string>> =
		PRE_REMEDIATION_SHA256,
): Promise<readonly ServiceAreaPatch[]> {
	assertPlanCap(displayedPlan);
	const currentPlan = buildPlan(await cms.read(), acceptedBeforeHashes);
	if (!isDeepStrictEqual(currentPlan, displayedPlan)) {
		throw new Error('[legal-service-area] state changed before apply');
	}
	for (const step of displayedPlan) {
		assertFreshLegalRow(await cms.readLegal(step.rowId), step);
		await cms.patch(step);
	}
	const remaining = buildPlan(await cms.read(), acceptedBeforeHashes);
	if (remaining.length !== 0) {
		throw new Error(
			`[legal-service-area] post-apply verification failed: ${remaining.length} patches remain`,
		);
	}
	return displayedPlan;
}

export async function runReconciliation(
	cms: LegalServiceAreaCms,
	apply: boolean,
	output: (line: string) => void = (line) => console.log(line),
	acceptedBeforeHashes: Readonly<Record<Locale, string>> =
		PRE_REMEDIATION_SHA256,
): Promise<readonly ServiceAreaPatch[]> {
	const displayedPlan = buildPlan(await cms.read(), acceptedBeforeHashes);
	output(formatPlan(displayedPlan));
	if (apply) {
		await applyAndVerify(cms, displayedPlan, acceptedBeforeHashes);
	}
	return displayedPlan;
}

function parseJson(value: unknown, label: string): unknown {
	if (typeof value !== 'string') return value;
	try {
		return JSON.parse(value);
	} catch {
		throw new Error(`[legal-service-area] malformed JSON for ${label}`);
	}
}

function responseData(response: RestResponse, label: string): unknown {
	if (response.status >= 400) {
		throw new Error(
			`[legal-service-area] ${label} failed (${response.status})`,
		);
	}
	const json = parseJson(response.json, `${label} response`);
	if (!isRecord(json) || !('data' in json)) {
		throw new Error(`[legal-service-area] malformed ${label} response`);
	}
	return parseJson(json.data, `${label} data`);
}

export function createLegalServiceAreaCms(
	ctx: ApplyContext,
	request: RestRequest = rest,
): LegalServiceAreaCms {
	return {
		read: async () => {
			const rows = responseData(
				await request(ctx, 'GET', LEGAL_PATH),
				'notice translation read',
			);
			if (!Array.isArray(rows)) {
				throw new Error('[legal-service-area] malformed live notice translations');
			}
			return { rows: rows as LegalRow[] };
		},
		readLegal: async (rowId) => {
			const path = `/items/legal_pages_translations/${encodeURIComponent(String(rowId))}?fields=id,languages_code,legal_pages_id,body`;
			const row = responseData(
				await request(ctx, 'GET', path),
				`notice row ${String(rowId)} read`,
			);
			if (!isRecord(row)) {
				throw new Error(
					`[legal-service-area] malformed notice row ${String(rowId)}`,
				);
			}
			return row as unknown as LegalRow;
		},
		patch: async (step) => {
			const response = await request(ctx, step.method, step.path, step.body);
			if (response.status >= 400) {
				throw new Error(
					`[legal-service-area] PATCH ${step.path} failed (${response.status})`,
				);
			}
		},
	};
}

async function main(): Promise<void> {
	const options = parseCli(process.argv.slice(2));
	const url = TARGET_URLS[options.target];
	console.log(
		`[legal-service-area] target=${options.target} url=${url} mode=${options.apply ? 'APPLY' : 'DRY-RUN'}`,
	);
	const token = await getAdminToken(url, { allowBuildToken: false });
	const cms = createLegalServiceAreaCms({ directusUrl: url, token });
	const displayedPlan = await runReconciliation(cms, options.apply);
	if (!options.apply) {
		console.log('[legal-service-area] dry-run complete; no writes sent');
		return;
	}
	console.log(
		`[legal-service-area] verified ${displayedPlan.length} PATCHes; NO CHANGES remain`,
	);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[legal-service-area] FAILED:', error);
		process.exit(1);
	});
}
