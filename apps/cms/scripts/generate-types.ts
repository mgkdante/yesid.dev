#!/usr/bin/env bun
/**
 * Handrolled Directus schema → TypeScript codegen (F12).
 *
 * Added in 18c Task 34. Reads /collections + /fields from live Directus,
 * emits per-collection row interfaces + a `DirectusSchema` map to
 * packages/shared/src/types/directus-schema.ts. Apps import that as:
 *   import type { DirectusSchema, ServiceRow } from '@repo/shared';
 *   const client = createClient<DirectusSchema>(url, token);
 *
 * Usage:
 *   cd apps/cms
 *   export DIRECTUS_ADMIN_TOKEN=<token>    # or email+password
 *   bun scripts/generate-types.ts
 *
 * CI drift check (Task 39 scope): run this in web.yml and fail if the
 * emitted file differs from HEAD — git diff --exit-code enforces the
 * committed file stays in sync with live CMS schema.
 */

import { readCollections, readFields } from '@directus/sdk';
import { defaultDirectusUrl, createClient } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const log = createLogger('gen-types');

// --- Directus → TS type mapping ---------------------------------------------

interface DirectusField {
	collection: string;
	field: string;
	type: string;
	schema: {
		is_nullable?: boolean;
		is_primary_key?: boolean;
	} | null;
	meta: {
		interface?: string | null;
		special?: readonly string[] | null;
		hidden?: boolean | null;
	} | null;
}

interface DirectusCollection {
	collection: string;
	meta: {
		hidden?: boolean | null;
		system?: boolean | null;
	} | null;
}

function mapDirectusTypeToTs(type: string, special: readonly string[] | null | undefined): string {
	// Special interface hints take priority (file M2O, translations O2M, etc.)
	if (special?.includes('file')) return 'string';
	if (special?.includes('files')) return 'readonly string[]';
	if (special?.includes('translations')) return 'readonly string[]';
	if (special?.includes('m2o')) return 'string';
	if (special?.includes('o2m')) return 'readonly string[]';
	if (special?.includes('m2m')) return 'readonly string[]';
	if (special?.includes('m2a')) return 'readonly string[]';
	if (special?.includes('json')) return 'unknown';
	if (special?.includes('csv')) return 'readonly string[]';
	if (special?.includes('date-created') || special?.includes('date-updated')) return 'string';
	if (special?.includes('user-created') || special?.includes('user-updated')) return 'string';
	if (special?.includes('uuid')) return 'string';
	if (special?.includes('hash')) return 'string';

	switch (type) {
		case 'string':
		case 'text':
		case 'uuid':
		case 'hash':
		case 'date':
		case 'time':
		case 'dateTime':
		case 'timestamp':
			return 'string';
		case 'integer':
		case 'bigInteger':
		case 'float':
		case 'decimal':
			return 'number';
		case 'boolean':
			return 'boolean';
		case 'json':
		case 'csv':
			return 'unknown';
		case 'alias': // computed — translations/sections junction inventories
			return 'unknown';
		default:
			return 'unknown';
	}
}

function toInterfaceName(collection: string): string {
	// services_translations → ServicesTranslationsRow
	return (
		collection
			.split('_')
			.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
			.join('') + 'Row'
	);
}

// --- Main codegen flow ------------------------------------------------------

interface GenerateOptions {
	directusUrl: string;
	token: string;
	outputPath: string;
}

export async function generateTypes(opts: GenerateOptions): Promise<void> {
	const client = createClient(opts.directusUrl, opts.token);

	log.info(`fetching collections + fields from ${opts.directusUrl}...`);
	const collections = (await client.request(readCollections())) as readonly DirectusCollection[];
	const fields = (await client.request(readFields())) as readonly DirectusField[];

	// User collections only (skip directus_*). Directus system tables would
	// bloat @repo/shared without consumer value; apps/cms scripts use SDK's
	// system readers directly when they need those.
	const userCollections = collections
		.filter((c) => !c.collection.startsWith('directus_'))
		.map((c) => c.collection)
		.sort();

	log.info(`emitting ${userCollections.length} user-collection row interfaces...`);

	const lines: string[] = [
		'// Auto-generated from live Directus /collections + /fields. Do not edit by hand.',
		'// Regenerate via: cd apps/cms && bun scripts/generate-types.ts',
		`// Source: ${opts.directusUrl} · generated ${new Date().toISOString()}`,
		'',
		'/* eslint-disable @typescript-eslint/consistent-type-definitions */',
		'',
	];

	// Emit one interface per user collection.
	for (const name of userCollections) {
		const collectionFields = fields
			.filter((f) => f.collection === name)
			.filter((f) => !f.meta?.hidden)
			.sort((a, b) => a.field.localeCompare(b.field));

		lines.push(`export interface ${toInterfaceName(name)} {`);
		for (const field of collectionFields) {
			const tsType = mapDirectusTypeToTs(field.type, field.meta?.special ?? null);
			const optional = field.schema?.is_nullable || field.schema?.is_primary_key === false ? '?' : '';
			lines.push(`\t${field.field}${optional}: ${tsType};`);
		}
		lines.push('}', '');
	}

	// DirectusSchema map — consumers pass this as the generic to createClient.
	lines.push('export interface DirectusSchema {');
	for (const name of userCollections) {
		lines.push(`\t${name}: ${toInterfaceName(name)}[];`);
	}
	lines.push('}', '');

	mkdirSync(dirname(opts.outputPath), { recursive: true });
	writeFileSync(opts.outputPath, lines.join('\n'), 'utf8');
	log.info(`wrote ${opts.outputPath}`);
}

async function main(): Promise<void> {
	const directusUrl = defaultDirectusUrl();
	const token = await getAdminToken(directusUrl);
	// packages/shared/src/types/directus-schema.ts relative to monorepo root.
	// import.meta.url → apps/cms/scripts/generate-types.ts
	const outputPath = resolve(
		fileURLToPath(import.meta.url),
		'../../../..',
		'packages/shared/src/types/directus-schema.ts',
	);
	await generateTypes({ directusUrl, token, outputPath });
	log.info('done.');
}

if (import.meta.main) {
	main().catch((err) => {
		log.error('FAILED:', err);
		process.exit(1);
	});
}
