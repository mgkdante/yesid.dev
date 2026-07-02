/**
 * Shared CLI entrypoint + flag-parsing boilerplate for apps/cms/scripts.
 *
 * Extracted in the A4 audit sweep to DRY two patterns repeated across ~55
 * one-off CMS scripts:
 *
 *   1. The `if (import.meta.main) { main().catch(...) }` entrypoint guard.
 *   2. The custom `parseFlags(argv)` boolean parser used by the seed-* family.
 *
 * Behavior-preserving: `runMain` reproduces the dominant guard exactly
 * (`console.error(err); process.exit(1)`), and `parseSeedFlags` returns the
 * same booleans (same flag spellings) the per-script parsers returned.
 *
 * No external deps — scripts are short-lived CLI tasks and apps/cms keeps its
 * runtime-deps minimal.
 */

/**
 * Standard entrypoint guard for a CLI script.
 *
 * Wraps the dominant pattern:
 *
 *   if (import.meta.main) {
 *     main().catch((err) => { console.error(err); process.exit(1); });
 *   }
 *
 * Accepts sync or async `main`; `Promise.resolve` normalizes both so a thrown
 * sync error is caught the same way as a rejected promise. On failure it logs
 * the raw error to stderr and exits with code 1 — matching the bare-`console.error`
 * variant used by the majority of scripts.
 *
 * Scripts whose catch handler prints a custom prefix (e.g. `'[seed] FAILED:'`),
 * extracts `err.message`, uses a scoped `log.error`, or has post-guard code
 * keep their inline guard — wrapping them here would change observable output.
 *
 * @param main The script's entrypoint. Called only when the CALLER is the
 *   process entrypoint, so importing the script for tests does not trigger it.
 * @param meta The caller's `import.meta`. REQUIRED: `import.meta.main` is
 *   per-module, so evaluating it inside this helper always yields false (this
 *   file is never the entrypoint). Before 2026-07-02 (pipeline-safety slice)
 *   the helper did exactly that, silently turning every runMain script into a
 *   no-op under Bun 1.3.x.
 *
 * @example
 *   import { runMain } from './lib/cli';
 *   async function main() { ... }
 *   runMain(main, import.meta);
 */
export function runMain(main: () => void | Promise<void>, meta: ImportMeta): void {
	if (meta.main) {
		Promise.resolve(main()).catch((err) => {
			console.error(err);
			process.exit(1);
		});
	}
}

/**
 * Flags returned by {@link parseSeedFlags}.
 *
 * Superset of the booleans the custom `parseFlags` functions in the seed-*
 * family returned. Callers destructure the subset they need; unused keys are
 * harmless.
 */
export interface SeedFlags {
	/** `--dry-run` present. Default mode for the seed-* scripts (no writes). */
	dryRun: boolean;
	/** `--reset` present. Clears existing rows before seeding. */
	reset: boolean;
	/** `--verbose` present. Extra per-item logging. */
	verbose: boolean;
	/** `--help` or `-h` present. Print usage and exit. */
	help: boolean;
}

/**
 * Parse the standard boolean flags shared by the seed-* scripts.
 *
 * Mirrors the per-script `parseFlags(argv)` parsers exactly, with the same flag
 * spellings:
 *
 *   - `--dry-run`            → `dryRun`
 *   - `--reset`              → `reset`
 *   - `--verbose`            → `verbose`
 *   - `--help` / `-h`        → `help`
 *
 * This is for the dry-run/reset family only. It does NOT cover the inverted
 * `--apply` opt-in parsers (where dry-run is the default and `--apply` enables
 * writes), nor the `parseArgs`-based scripts that read `--file=VALUE`. Those
 * keep their own parsers.
 *
 * @param argv Argument vector to scan. Defaults to `process.argv.slice(2)`.
 * @returns The parsed {@link SeedFlags}.
 *
 * @example
 *   import { parseSeedFlags } from './lib/cli';
 *   const { dryRun, reset } = parseSeedFlags();
 */
export function parseSeedFlags(argv: readonly string[] = process.argv.slice(2)): SeedFlags {
	return {
		dryRun: argv.includes('--dry-run'),
		reset: argv.includes('--reset'),
		verbose: argv.includes('--verbose'),
		help: argv.includes('--help') || argv.includes('-h'),
	};
}
