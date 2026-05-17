/**
 * Top-level module-emitter: wraps the value serializer with a generated-file
 * header + type imports per the per-module config in `configs.ts`.
 *
 * Output structure:
 *
 *   // <header comment>
 *   import type { ... } from '...';
 *
 *   export const <exportName>: <typeName> = <serialized data>;
 *   export const <other>: ... = ...;
 *
 * Idempotency: input data → output bytes is deterministic. Two runs on
 * unchanged CMS data produce byte-identical output.
 */

import { emitExport } from './format';

export interface ExportDecl {
	name: string;
	typeName: string;
	value: unknown;
}

export interface ImportDecl {
	/** Symbols to import from `from`. */
	symbols: readonly string[];
	from: string;
	/** When true, emits `import type {...}` instead of `import {...}`. */
	typeOnly?: boolean;
}

export interface ModuleEmitConfig {
	/** Absolute path to the target file under apps/web/src/lib/content/. */
	filePath: string;
	/** Short description for the auto-generated header comment. */
	description: string;
	imports: readonly ImportDecl[];
	exports: readonly ExportDecl[];
	/**
	 * Optional companion-module path (relative, e.g. `./nav.companion`). When set,
	 * the generated file appends `export * from '<path>';` so consumers can keep
	 * importing chrome/helpers/types via the original `./<name>` path instead of
	 * having to switch to `./<name>.companion`. Keeps the public API stable.
	 */
	reExportFromCompanion?: string;
}

export function emitModule(config: ModuleEmitConfig): string {
	const headerLines = [
		'// ----------------------------------------------------------------------',
		'// GENERATED FILE — do not edit by hand.',
		'//',
		`// ${config.description}`,
		'//',
		'// Source: live Directus CMS state via `bun run export:fallbacks`',
		'// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via',
		"// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.",
		'// ----------------------------------------------------------------------',
	];

	const importLines = config.imports.map((imp) => {
		const kw = imp.typeOnly ? 'import type' : 'import';
		const list = imp.symbols.join(', ');
		return `${kw} { ${list} } from '${imp.from}';`;
	});

	const exportLines = config.exports.map((exp) => emitExport(exp.name, exp.typeName, exp.value));

	const reExportLines = config.reExportFromCompanion
		? [
				`// Re-export hand-written companion module so consumers can keep importing`,
				`// chrome / helpers / type defs from the original path '${config.filePath.split('/').pop()?.replace(/\.ts$/, '')}'.`,
				`export * from '${config.reExportFromCompanion}';`,
			]
		: [];

	const blocks: string[] = [headerLines.join('\n')];
	if (importLines.length > 0) blocks.push(importLines.join('\n'));
	if (exportLines.length > 0) blocks.push(exportLines.join('\n\n'));
	if (reExportLines.length > 0) blocks.push(reExportLines.join('\n'));

	// Two newlines between blocks (header → imports → exports → re-exports).
	// Single trailing newline at EOF (POSIX convention).
	return blocks.join('\n\n') + '\n';
}
