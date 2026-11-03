import type { CompleteExportData, ExportData } from '../export-data';
import { EXPORT_MODULES, type LiveExportContext } from './export-modules';
import { checkLocalization } from './validators/integrity';
import { validateLiveExport } from './validators/live-export';

export class ExportValidationError extends Error {}

type ExportModule = (typeof EXPORT_MODULES)[number];

/** Fixture and live provide the same module snapshots; neither adapter writes. */
export interface ExportSource {
	read(module: ExportModule): Promise<unknown>;
}

export function createFixtureSource(snapshot: unknown): ExportSource {
	return { read: async () => snapshot };
}

export function createLiveSource(read: ExportSource['read']): ExportSource {
	return { read };
}

export function directusSource(context: LiveExportContext): ExportSource {
	return createLiveSource((module) => module.fetch(context));
}

/** Check raw values but retain their bytes: schema defaults/stripping must not rewrite editorial data. */
export function validateExport(
	data: ExportData,
): asserts data is CompleteExportData {
	for (const module of EXPORT_MODULES) {
		const result = module.schema.safeParse(data);
		if (!result.success)
			throw new ExportValidationError(
				`Invalid export module ${module.name}: ${result.error.message}`,
			);
	}
	const complete = data as CompleteExportData;
	for (const module of EXPORT_MODULES) {
		// Each checker accepts its own module's fields plus the shared relation targets.
		module.check?.(complete, complete);
	}
	checkLocalization(data);
	validateLiveExport(data);
}

/** Fetch only. Validation errors are never eligible for the connectivity cache fallback. */
export async function readExport(
	source: ExportSource,
	modules: readonly ExportModule[] = EXPORT_MODULES,
): Promise<ExportData> {
	const snapshots = await Promise.all(
		modules.map(async (module) => {
			const snapshot = await source.read(module);
			if (!snapshot || typeof snapshot !== 'object')
				throw new ExportValidationError(
					`Invalid export module ${module.name}: expected an object`,
				);
			return Object.fromEntries(
				Object.keys(module.schema.shape).map((key) => [
					key,
					(snapshot as Record<string, unknown>)[key],
				]),
			);
		}),
	);
	return Object.assign({}, ...snapshots);
}

export async function loadExport(
	source: ExportSource,
): Promise<CompleteExportData> {
	const data = await readExport(source);
	validateExport(data);
	return data;
}
