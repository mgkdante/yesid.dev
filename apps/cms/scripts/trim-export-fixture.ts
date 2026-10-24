#!/usr/bin/env bun
/** Build a compact, reviewable offline fixture from an authenticated export cache. */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { isDeepStrictEqual, parseArgs } from 'node:util';
import { BlockEditorDocSchema } from '@repo/shared';
import type { ExportData } from './export-data';
import { readCache } from './lib/cache';
import { buildEmitConfigs } from './lib/emitters/configs';

export const FIXTURE_PATH = resolve(import.meta.dir, '../../../packages/shared/fixtures/export-data.json');
const DEFAULT_SOURCE = resolve(import.meta.dir, '../../web/src/lib/content/.cms-cache.json');

type JsonObject = Record<string, unknown>;
const isObject = (value: unknown): value is JsonObject =>
	value !== null && typeof value === 'object' && !Array.isArray(value);
const PROSE = /^(text|title|heading|subheading|description|defaultDescription|excerpt|oneLiner|quote|caption|intro|subtitle|summary|content|body|helper|helperLive)$/;
const IDENTITY = /^(id|slug|translationKey|lang|path|href|url|relatedProjects|relatedServices|stack|tags)$/;
const LOCALE = /^(en|es|fr)$/;
const UUID = /[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/i;

/** Keep inline markup, links, template slots and asset references verbatim. */
function shortCopy(value: string): string {
	// Protect tokens individually so a slot or link does not retain its whole paragraph.
	const tokens = /(<\/?[a-z][^>]*>|\{[^{}\r\n]+\}|(?:https?:\/\/|mailto:)[^\s<>"']+|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})/gi;
	return value.split(tokens).map((part, index) =>
		index % 2 || !part.trim() ? part : 'Fixture copy.',
	).join('');
}

function hasReferences(value: unknown): boolean {
	if (typeof value === 'string') return UUID.test(value) || /href\s*=|https?:|mailto:|\{[^{}]+\}/.test(value);
	if (Array.isArray(value)) return value.some(hasReferences);
	return isObject(value) && Object.entries(value).some(([key, entry]) =>
		IDENTITY.test(key) || key === 'file' || hasReferences(entry),
	);
}

/** Distinguish renderer branches while dropping repeated prose blocks per document. */
function blockBranch(block: JsonObject): string {
	const data = isObject(block.data) ? block.data : {};
	return JSON.stringify([
		block.type, data.level, data.style, data.language, data.alignment,
		String(data.code ?? '').match(/^```([^\s]*)/)?.[1],
		data.withHeadings, data.stretched, data.withBorder, data.withBackground,
		// Inline formatting and link branches must survive paragraph deduplication.
		[...new Set(JSON.stringify(data).match(/<\/?[a-z]+\b/g) ?? [])].sort(),
	]);
}

function trimValue(value: unknown, field = '', labels = false): unknown {
	if (IDENTITY.test(field)) return value;
	if (typeof value === 'string') return PROSE.test(field) || labels ? shortCopy(value) : value;
	if (Array.isArray(value)) {
		let entries = value;
		if (field === 'blocks') {
			const seen = new Set<string>();
			entries = value.filter((block) => {
				if (!isObject(block)) return true;
				const branch = blockBranch(block);
				const first = !seen.has(branch);
				seen.add(branch);
				// Keep all blocks carrying media UUIDs, images, or route links.
				return first || hasReferences(block.data);
			});
		}
		return entries.map((entry) => trimValue(entry, field, labels));
	}
	if (!isObject(value)) return value;
	return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
		key, trimValue(entry, LOCALE.test(key) ? field : key, labels || key === 'siteLabels'),
	]));
}

export function trimExportData(data: ExportData): ExportData {
	// Derived from the asset manifest during fixture export, exactly as for live data.
	const { mediaAssets: _assets, mediaVariants: _variants, ...editorial } = data;
	return trimValue(editorial) as ExportData;
}

export function serializeFixture(data: ExportData): string {
	// readCache owns the versioned envelope parser used by the exporter.
	return JSON.stringify({ version: '1', directusUrl: 'fixture', data }, null, '\t') + '\n';
}

/** Domain identity includes array order and every locale/key; editor block IDs are metadata. */
function blockIdentities(value: unknown, path = ''): unknown[] {
	if (Array.isArray(value)) return value.flatMap((entry, index) => blockIdentities(entry, `${path}[${index}]`));
	if (!isObject(value)) return [];
	return Object.entries(value).flatMap(([key, entry]): unknown[] =>
		IDENTITY.test(key) ? [[`${path}.${key}`, entry]]
			: [...(LOCALE.test(key) ? [[`${path}.${key}`]] : []), ...blockIdentities(entry, `${path}.${key}`)],
	);
}

function identities(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(identities);
	if (!isObject(value)) return null;
	return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key,
		key === 'blocks' && Array.isArray(entry)
			? [...new Set(entry.map((block) => JSON.stringify([
				blockBranch(block as JsonObject), blockIdentities((block as JsonObject).data),
			])))].sort()
			: IDENTITY.test(key) ? entry : identities(entry),
	]));
}

function protectedTokens(value: unknown): string[] {
	const tokens = new Set<string>();
	const visit = (entry: unknown): void => {
		if (typeof entry === 'string') {
			for (const token of entry.match(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}|<\/?[a-z][^>]*>|\{[^{}\r\n]+\}|(?:https?:\/\/|mailto:)[^\s<>"']+/gi) ?? []) tokens.add(token);
		} else if (entry && typeof entry === 'object') Object.values(entry).forEach(visit);
	};
	visit(value);
	return [...tokens].sort();
}

function validateDocs(value: unknown): void {
	if (!value || typeof value !== 'object') return;
	if (isObject(value) && 'blocks' in value) BlockEditorDocSchema.parse(value);
	Object.values(value).forEach(validateDocs);
}

/** Refuse to write a partial snapshot or one that changes identities or renderer coverage. */
export function assertTrimmedExportData(source: ExportData, trimmed: ExportData): void {
	const { mediaAssets, mediaVariants, ...editorial } = source;
	if ('mediaAssets' in trimmed || 'mediaVariants' in trimmed) {
		throw new Error('Fixture must omit derived media maps');
	}
	if (!isDeepStrictEqual(identities(editorial), identities(trimmed))) {
		throw new Error('Trim changed domain identities, locale keys or renderer branches');
	}
	if (!isDeepStrictEqual(protectedTokens(editorial), protectedTokens(trimmed))) {
		throw new Error('Trim changed media UUIDs, inline markup, template slots or links');
	}
	validateDocs(trimmed);
	// Fixture mode supplies both derived maps before building configs. The source
	// cache already has them; hermetic fixture validation can use empty maps.
	const configs = buildEmitConfigs({ ...trimmed, mediaAssets: mediaAssets ?? {}, mediaVariants: mediaVariants ?? {} }, '/fixture');
	if (configs.length !== 20) throw new Error(`Expected 20 emit configs, received ${configs.length}`);
}

if (import.meta.main) {
	const { values } = parseArgs({ options: { from: { type: 'string', default: DEFAULT_SOURCE } }, allowPositionals: false });
	const source = await readCache(resolve(values.from!));
	if (!source) throw new Error(`Missing export source: ${values.from}`);
	const trimmed = trimExportData(source);
	assertTrimmedExportData(source, trimmed);
	const fixture = serializeFixture(trimmed);
	await mkdir(dirname(FIXTURE_PATH), { recursive: true });
	await writeFile(FIXTURE_PATH, fixture, 'utf8');
	console.info(`fixture: ${FIXTURE_PATH} (${fixture.split('\n').length - 1} lines; invariants passed)`);
}
