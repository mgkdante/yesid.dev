import { resolve } from 'node:path';
import type { ExportData, CompleteExportData } from '../../export-data';
import { EXPORT_MODULES } from '../export-modules';
import type { ModuleEmitConfig } from './emit-module';
export { withoutOwnerPhone } from '../export-modules';

/** Output inventory is derived from the module definitions. */
export function buildEmitConfigs(
	data: ExportData,
	contentDir: string,
): readonly ModuleEmitConfig[] {
	const missing = EXPORT_MODULES.flatMap((module) =>
		Object.keys(module.schema.shape),
	).filter((key) => data[key as keyof ExportData] === undefined);
	if (missing.length)
		throw new Error(
			`incomplete CMS export data; missing: ${missing.join(', ')}`,
		);
	return EXPORT_MODULES.flatMap((module) =>
		module.emit(data as CompleteExportData),
	).map(({ fileName, ...config }) => ({
		filePath: resolve(contentDir, fileName),
		...config,
	}));
}
