/** Retained schema and validation for the asset inventory and committed mirrors. */
import { z } from 'zod';

export const AssetEntrySchema = z.object({
	legacyPath: z.string().min(1),
	sha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
	folder: z.string().min(1),
	title: z.string().min(1),
	description: z.string().min(1),
});

export const AssetsManifestSchema = z.object({
	description: z.string().min(1),
	sourceRoot: z.string().min(1),
	folders: z.record(z.string().min(1), z.string().min(1)),
	assets: z.array(AssetEntrySchema).min(1),
});

export type AssetsManifest = z.infer<typeof AssetsManifestSchema>;

/** Parse + validate the manifest; throws on shape drift. */
export function parseManifest(json: unknown): AssetsManifest {
	return AssetsManifestSchema.parse(json);
}

/**
 * Parse the first-level folder name off a legacy path. Used when inspecting
 * files or validating manifest grouping consistency.
 */
export function extractLegacyTopLevel(legacyPath: string): string {
	const parts = legacyPath.split('/');
	return parts.length > 1 ? (parts[0] ?? '') : '';
}

/**
 * Validate that every manifest entry's declared `folder` is one of the named
 * folders in the manifest's `folders` map. Catches typos like "proyects" vs
 * "projects" at load-time.
 */
export function validateFolderReferences(manifest: AssetsManifest): string[] {
	const errors: string[] = [];
	const declared = new Set(Object.keys(manifest.folders));
	for (const entry of manifest.assets) {
		if (!declared.has(entry.folder)) {
			errors.push(
				`asset "${entry.legacyPath}" references folder "${entry.folder}" which is not declared in the manifest's folders map`,
			);
		}
	}
	return errors;
}
