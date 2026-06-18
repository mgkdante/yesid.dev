#!/usr/bin/env bun
/**
 * Seed Directus storage_asset_presets from fixtures/brand/presets.json.
 *
 * Slice 18 18d Task 18. Pushes the 4-preset config (or 7 with AVIF post-probe)
 * into directus_settings.storage_asset_presets. STORAGE_ASSET_TRANSFORM=presets
 * is locked on Railway (18c Task 37), so editor-uploaded files are served via
 * /assets/<id>?key=<preset>; ad-hoc transforms return 403.
 *
 * Strategy:
 *   1. Load fixtures/brand/presets.json + Zod-validate.
 *   2. Auth to Directus (lib/auth).
 *   3. PATCH /settings with { storage_asset_presets: [...] }.
 *   4. Read back + assert count.
 *
 * Pure helper `buildPresetPayload` exported for tests.
 */
import { readSettings, updateSettings } from '@directus/sdk';
import { readFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';
import { PresetsConfigSchema, type PresetsConfig } from './lib/schemas/presets';
import { parseSeedFlags } from './lib/cli';

const log = createLogger('seed-presets');

interface Schema {
	directus_settings: {
		storage_asset_presets: PresetsConfig['presets'];
	};
}

/** Build the PATCH payload for directus_settings. Pure; tested. */
export function buildPresetPayload(config: PresetsConfig): { storage_asset_presets: PresetsConfig['presets'] } {
	return { storage_asset_presets: config.presets };
}

interface SeedOptions {
	directusUrl: string;
	token: string;
	dryRun: boolean;
}

export async function seedPresets(config: PresetsConfig, opts: SeedOptions): Promise<void> {
	const payload = buildPresetPayload(config);
	if (opts.dryRun) {
		log.info(`dry-run: would patch directus_settings.storage_asset_presets with ${config.presets.length} presets`);
		for (const p of config.presets) {
			log.info(`  ~ ${p.key.padEnd(20)} fit=${p.fit} ${p.width ?? '?'}x${p.height ?? '?'} ${p.format} q=${p.quality}`);
		}
		return;
	}

	const client = createClient<Schema>(opts.directusUrl, opts.token);
	try {
		await client.request(updateSettings(payload));
	} catch (err) {
		const msgs = parseErrors(err);
		throw new DirectusError(500, `Failed to update settings: ${msgs.join(' \u00b7 ')}`);
	}

	const fresh = await client.request(readSettings({ fields: ['storage_asset_presets'] }));
	const count = fresh?.storage_asset_presets?.length ?? 0;
	log.info(`verified: ${count} presets live in Directus`);
	if (count !== config.presets.length) {
		throw new Error(
			`[seed-presets] count mismatch: expected ${config.presets.length}, got ${count}`,
		);
	}
}

export function loadPresetsFixture(): PresetsConfig {
	const path = joinPath(import.meta.dir, '..', 'fixtures', 'brand', 'presets.json');
	const raw = JSON.parse(readFileSync(path, 'utf8'));
	return PresetsConfigSchema.parse(raw);
}

async function main(): Promise<void> {
	const { dryRun } = parseSeedFlags();
	const directusUrl = defaultDirectusUrl();
	log.info(`target: ${directusUrl}${dryRun ? ' [dry-run]' : ''}`);

	const config = loadPresetsFixture();
	log.info(`source: ${config.presets.length} presets from fixtures/brand/presets.json`);

	if (dryRun) {
		await seedPresets(config, { directusUrl, token: '', dryRun: true });
		return;
	}

	const token = await getAdminToken(directusUrl);
	await seedPresets(config, { directusUrl, token, dryRun: false });
	log.info('done.');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[seed-presets] FAILED:', err);
		process.exit(1);
	});
}
