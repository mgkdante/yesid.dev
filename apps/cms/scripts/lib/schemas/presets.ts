/**
 * Zod schema for storage_asset_presets — validates the retained brand fixture.
 *
 * Mirrors the committed `directus_settings.storage_asset_presets` configuration shape.
 * See: https://docs.directus.io/configuration/storage.html#asset-presets
 */
import { z } from 'zod';

export const PresetEntrySchema = z.object({
	key: z.string().regex(/^[a-z0-9-]+$/, 'key must be kebab-case'),
	fit: z.enum(['cover', 'contain', 'inside', 'outside']),
	width: z.number().int().positive().optional(),
	height: z.number().int().positive().optional(),
	format: z.enum(['jpg', 'png', 'webp', 'avif', 'tiff']),
	quality: z.number().int().min(1).max(100),
	withoutEnlargement: z.boolean().optional(),
});

export const PresetsConfigSchema = z.object({
	presets: z.array(PresetEntrySchema).min(1),
});
