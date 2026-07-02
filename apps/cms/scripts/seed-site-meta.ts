#!/usr/bin/env bun
/**
 * Seed Directus `site_meta` singleton from `fixtures/singletons/site-meta.json`.
 *
 * Slice 18 18h Phase 3 Task 6 — first singleton seed in this repo. Combines
 * brand identity (name, links, owner.*) + SEO defaults (default_og_image,
 * theme_color, default_description) into one singleton row.
 *
 * Singleton-upsert semantics (per research.md § P4):
 *   `updateSingleton('site_meta', payload)` creates the row if it doesn't
 *   exist; overwrites the payload otherwise. There is exactly one row by
 *   construction (Directus enforces). `--reset` is accepted for CLI parity
 *   with collection seeds but is a no-op (we always upsert).
 *
 * Pure helpers (`loadSiteMetaFixture`) exported for
 * tests/seed-site-meta-dry-run.test.ts.
 *
 * Run from REPO ROOT:
 *   bun run apps/cms/scripts/seed-site-meta.ts            # writes live
 *   bun run apps/cms/scripts/seed-site-meta.ts --dry-run  # preview
 *   bun run apps/cms/scripts/seed-site-meta.ts --reset    # accepted no-op
 */

import {
	createItem,
	deleteItems,
	readItems,
	updateSingleton,
} from '@directus/sdk';
import { z } from 'zod';
import fixtureData from '../fixtures/singletons/site-meta.json' with { type: 'json' };
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';
import { parseSeedFlags } from './lib/cli';

// --- Types -----------------------------------------------------------------

import type { Locale } from '@repo/shared';
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'fr', 'es'] as const;

// --- Zod schemas (validate fixture JSON at load-time) ----------------------
//
// Per spec.md § Schema:
//   - parent fields: 13 (id + 12 business fields)
//   - translation rows: at least 1 EN required (FR/ES optional, partial)
//   - EN default_description must be 50-200 chars (SEO band); FR/ES allow
//     empty strings since copy is added later via Data Studio
//   - tagline/description allow empty strings (FR/ES rows ship empty in
//     fixture; EN required by .superRefine)

const SiteMetaTranslationSchema = z.object({
	languages_code: z.enum(['en', 'fr', 'es']),
	tagline: z.string().max(100),
	description: z.string().max(300),
	default_description: z.string(), // EN-only 50-200 enforcement via parent .superRefine
	owner_job_title: z.string().max(80),
});

export const SiteMetaFixtureSchema = z
	.object({
		id: z.literal(1),
		name: z.string().max(30),
		email: z.string().email(),
		github_url: z.string().url(),
		linkedin_url: z.string().url().nullable().optional(),
		upwork_url: z.string().url().nullable().optional(),
		owner_name: z.string().max(80),
		owner_locality: z.string().max(80),
		owner_region: z.string().max(4),
		owner_country: z.string().length(2),
		owner_knows_about: z.string(), // CSV
		default_og_image: z.string().uuid().nullable(),
		theme_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
		translations: z.array(SiteMetaTranslationSchema).min(1),
	})
	.superRefine((value, ctx) => {
		const en = value.translations.find((t) => t.languages_code === 'en');
		if (!en) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['translations'],
				message: 'EN translation required',
			});
			return;
		}
		const len = en.default_description.length;
		if (len < 50 || len > 200) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['translations', 'en', 'default_description'],
				message: `EN default_description must be 50–200 chars (got ${len})`,
			});
		}
		// EN tagline + description are required to be non-empty for the brand
		// SiteMeta shape downstream consumers expect.
		if (en.tagline.length === 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['translations', 'en', 'tagline'],
				message: 'EN tagline required',
			});
		}
		if (en.description.length === 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['translations', 'en', 'description'],
				message: 'EN description required',
			});
		}
	});

export type SiteMetaFixture = z.infer<typeof SiteMetaFixtureSchema>;
export type SiteMetaTranslationFixture = z.infer<typeof SiteMetaTranslationSchema>;

/** Parse + return the fixture. Exported for tests to share the same code path. */
export function loadSiteMetaFixture(): SiteMetaFixture {
	return SiteMetaFixtureSchema.parse(fixtureData);
}

// --- Directus I/O ----------------------------------------------------------
//
// Singleton schema typing: `site_meta` is a single object (not an array) in
// the SDK's view. SDK's SingletonCollections<Schema> resolves correctly when
// the value type is a non-array object.

interface Schema {
	site_meta: DirectusSiteMetaRow;
	site_meta_translations: (DirectusSiteMetaTranslationRow & {
		id?: number;
		site_meta_id?: number;
	})[];
}

export type DirectusSiteMetaTranslationRow = SiteMetaTranslationFixture;
export type DirectusSiteMetaRow = Omit<SiteMetaFixture, 'translations'> & {
	translations?: readonly DirectusSiteMetaTranslationRow[];
};

export function toSiteMetaTranslationRows(
	fixture: SiteMetaFixture,
): readonly DirectusSiteMetaTranslationRow[] {
	return fixture.translations.map((t) => ({
		languages_code: t.languages_code,
		tagline: t.tagline,
		description: t.description,
		default_description: t.default_description,
		owner_job_title: t.owner_job_title,
	}));
}

/**
 * Directus singleton nested-update does not auto-link translation FKs on
 * re-run. Patch parent scalars only; translations are replaced explicitly.
 */
export function toSiteMetaSingletonPatch(
	fixture: SiteMetaFixture,
): Omit<DirectusSiteMetaRow, 'id' | 'translations'> {
	const { id: _id, translations: _translations, ...patch } = fixture;
	return patch;
}

const log = createLogger('seed-site-meta');

export interface SeedRunOptions {
	directusUrl: string;
	token: string;
	dryRun?: boolean;
	reset?: boolean; // accepted for CLI parity; no-op for singletons
}

export async function seedSiteMeta(
	fixture: SiteMetaFixture,
	opts: SeedRunOptions,
): Promise<void> {
	if (opts.dryRun) {
		const en = fixture.translations.find((t) => t.languages_code === 'en');
		const taglinePreview = (en?.tagline ?? '').slice(0, 60);
		const fieldCount = Object.keys(toSiteMetaSingletonPatch(fixture)).length;
		log.info(
			`dry-run: would upsert site_meta singleton against ${opts.directusUrl}`,
		);
		log.info(`  id=${fixture.id}`);
		log.info(`  parent fields=${fieldCount}`);
		log.info(`  translation rows=${fixture.translations.length}`);
		log.info(`  EN tagline preview="${taglinePreview}"`);
		for (const t of fixture.translations) {
			log.info(
				`  ~ ${t.languages_code}  tagline=${t.tagline.length}  ` +
					`desc=${t.description.length}  default_desc=${t.default_description.length}  ` +
					`job=${t.owner_job_title.length}`,
			);
		}
		log.info('dry-run complete (no writes).');
		return;
	}

	if (opts.reset) {
		log.warn(
			'--reset is a no-op for singletons (always upsert). Continuing with upsert.',
		);
	}

	const client = createClient<Schema>(opts.directusUrl, opts.token);

	try {
		await client.request(
			updateSingleton(
				'site_meta',
				toSiteMetaSingletonPatch(
					fixture,
				) as unknown as Parameters<typeof updateSingleton>[1],
			),
		);
	} catch (err) {
		const msgs = parseErrors(err);
		throw new DirectusError(
			500,
			`Failed to upsert site_meta singleton: ${msgs.join(' · ')}`,
		);
	}

	const existingTranslations = await client.request(
		readItems('site_meta_translations', {
			fields: ['id'],
			filter: { site_meta_id: { _eq: fixture.id } },
			limit: -1,
		}),
	);
	const existingIds = existingTranslations
		.map((row) => row.id)
		.filter((id): id is number => typeof id === 'number');

	if (existingIds.length > 0) {
		try {
			await client.request(deleteItems('site_meta_translations', existingIds));
		} catch (err) {
			const msgs = parseErrors(err);
			throw new DirectusError(
				500,
				`Failed to clear site_meta translations: ${msgs.join(' · ')}`,
			);
		}
	}

	for (const t of toSiteMetaTranslationRows(fixture)) {
		try {
			await client.request(
				createItem('site_meta_translations', {
					...t,
					site_meta_id: fixture.id,
				} as unknown as DirectusSiteMetaTranslationRow & {
					site_meta_id: number;
				}),
			);
		} catch (err) {
			const msgs = parseErrors(err);
			throw new DirectusError(
				500,
				`Failed to create site_meta translation [${t.languages_code}]: ${msgs.join(' · ')}`,
			);
		}
	}

	log.info(`✓ site_meta upserted  id=${fixture.id}`);
}

async function main(): Promise<void> {
	const { dryRun, reset } = parseSeedFlags();
	const directusUrl = defaultDirectusUrl();
	assertDevCms(directusUrl);
	log.info(
		`target: ${directusUrl}${dryRun ? ' [dry-run]' : reset ? ' [reset (no-op for singletons)]' : ''}`,
	);

	const fixture = loadSiteMetaFixture();
	log.info(
		`source: site_meta singleton (id=${fixture.id}, ` +
			`${fixture.translations.length} translation rows) from fixtures/singletons/site-meta.json`,
	);

	if (dryRun) {
		await seedSiteMeta(fixture, { directusUrl, token: '', dryRun: true });
		return;
	}

	const token = await getAdminToken(directusUrl);
	await seedSiteMeta(fixture, { directusUrl, token, reset });
	log.info('done.');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[seed-site-meta] FAILED:', err);
		process.exit(1);
	});
}
