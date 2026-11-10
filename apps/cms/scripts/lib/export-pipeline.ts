import { validateProjectLines } from '../../../web/src/lib/og/validate-project-lines';
import { ProjectSchema } from '@repo/shared/schemas';
import type { CompleteExportData, ExportData } from '../export-data';
import { EXPORT_MODULES, type LiveExportContext } from './export-modules';
import { z } from 'zod';
import {
	checkLocalization,
	checkFixtureRoster,
	contentPath,
} from './validators/integrity';
import { validateLiveExport } from './validators/live-export';

export class ExportValidationError extends Error {}

type ExportModule = (typeof EXPORT_MODULES)[number];

/** Fixture and live provide the same module snapshots; neither adapter writes. */
export interface ExportSource {
	kind: 'fixture' | 'live';
	read(module: ExportModule): Promise<unknown>;
}

const dataKeys = new Set(
	EXPORT_MODULES.flatMap((module) => Object.keys(module.schema.shape)),
);

function requireKnownKeys(
	snapshot: object,
	keys: ReadonlySet<string>,
	label: string,
): void {
	const unknown = Object.keys(snapshot).filter((key) => !keys.has(key));
	if (unknown.length)
		throw new ExportValidationError(
			`${label}: unknown export keys: ${unknown.join(', ')}`,
		);
}

function schemaError(
	module: string,
	error: z.ZodError,
	snapshot?: unknown,
): ExportValidationError {
	return new ExportValidationError(
		`Invalid export module ${module}:\n${error.issues
			.map(
				(issue) =>
					`- ${contentPath(snapshot, issue.path)}: ${issue.message.replace(/\s+/g, ' ')}`,
			)
			.join('\n')}`,
	);
}

export function createFixtureSource(snapshot: unknown): ExportSource {
	return {
		kind: 'fixture',
		read: async (module) => {
			if (!snapshot || typeof snapshot !== 'object')
				throw new ExportValidationError(
					'Invalid fixture snapshot: expected an object',
				);
			requireKnownKeys(snapshot, dataKeys, 'Fixture snapshot');
			return Object.fromEntries(
				Object.keys(module.schema.shape).map((key) => [
					key,
					Reflect.get(snapshot, key),
				]),
			);
		},
	};
}

export function createLiveSource(read: ExportSource['read']): ExportSource {
	return { kind: 'live', read };
}

export function directusSource(context: LiveExportContext): ExportSource {
	return createLiveSource((module) => module.fetch(context));
}

/** Check raw values but retain their bytes: schema defaults/stripping must not rewrite editorial data. */
export function validateExport(
	data: ExportData,
	options: {
		source: ExportSource['kind'];
		warn?: (message: string) => void;
	} = { source: 'fixture' },
): asserts data is CompleteExportData {
	requireKnownKeys(data, dataKeys, 'Export snapshot');
	for (const module of EXPORT_MODULES) {
		const result = module.schema.safeParse(data);
		if (!result.success) throw schemaError(module.name, result.error, data);
	}
	const complete = data as CompleteExportData;
	try {
		validateProjectLines(complete.projects);
	} catch (error) {
		throw new ExportValidationError((error as Error).message, { cause: error });
	}
	// NFC is an intentional field normalization; preserve all other editorial bytes.
	for (const project of complete.projects) project.oneLiner = ProjectSchema.shape.oneLiner.parse(project.oneLiner);
	for (const module of EXPORT_MODULES) {
		// Each checker accepts its own module's fields plus the shared relation targets.
		module.check?.(complete, complete);
	}
	const issues = checkLocalization(data);
	if (options.source === 'fixture') {
		checkFixtureRoster(complete);
		if (issues.length)
			throw new ExportValidationError(
				`Fixture localization failed:\n${issues.map((issue) => `- ${issue}`).join('\n')}`,
			);
	} else {
		const warn = options.warn ?? console.warn;
		for (const issue of issues)
			warn(`Live content localization warning: ${issue}`);
	}
	validateLiveExport(data);
}

/** Fetch only. Validation errors are never eligible for the connectivity cache fallback. */
export async function readExport(
	source: ExportSource,
	modules: readonly ExportModule[] = EXPORT_MODULES,
): Promise<ExportData> {
	const snapshots = await Promise.all(
		modules.map(async (module) => {
			let snapshot: unknown;
			try {
				snapshot = await source.read(module);
			} catch (error) {
				if (error instanceof z.ZodError) throw schemaError(module.name, error);
				throw error;
			}
			if (!snapshot || typeof snapshot !== 'object')
				throw new ExportValidationError(
					`Invalid export module ${module.name}: expected an object`,
				);
			requireKnownKeys(
				snapshot,
				new Set(Object.keys(module.schema.shape)),
				`Export module ${module.name}`,
			);
			return snapshot;
		}),
	);
	return Object.assign({}, ...snapshots);
}

export async function loadExport(
	source: ExportSource,
	options: { warn?: (message: string) => void } = {},
): Promise<CompleteExportData> {
	const data = await readExport(source);
	validateExport(data, { source: source.kind, ...options });
	return data;
}
