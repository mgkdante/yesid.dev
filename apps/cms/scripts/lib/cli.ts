/**
 * Shared CLI entrypoint + flag-parsing boilerplate for apps/cms/scripts.
 *
 * Extracted in the A4 audit sweep to DRY two patterns repeated across ~55
 * one-off CMS scripts:
 *
 *   1. The `if (import.meta.main) { main().catch(...) }` entrypoint guard.
 *   2. The custom `parseFlags(argv)` boolean parser used by the seed-* family.
 *
 * `runMain` reproduces the dominant guard exactly (`console.error(err);
 * process.exit(1)`). `parseSeedFlags` is intentionally stricter: it accepts
 * a small allowlist and makes destructive and script-specific modes explicit.
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
	/** Dry-run mode. This is the default unless `--apply` is present. */
	dryRun: boolean;
	/** `--reset` present. Clears existing rows before seeding. */
	reset: boolean;
	/** `--verbose` present. Extra per-item logging. */
	verbose: boolean;
	/** `--help` or `-h` present. Print usage and exit. */
	help: boolean;
}

/** Optional seed-script behaviors a caller explicitly supports. */
export interface SeedFlagCapabilities {
	reset?: boolean;
	verbose?: boolean;
	help?: boolean;
}

/** Exact value required alongside `--apply --reset` before seed data is reset. */
export const RESET_SEED_DATA_CONFIRMATION = 'RESET-SEED-DATA';

/**
 * Parse the strict seed-script flag contract.
 *
 * `--apply` opts into writes; omitted mode defaults to dry-run. `--reset`,
 * `--verbose`, and help are available only when the caller declares the
 * matching capability. Help is valid only by itself. Reset is valid only with
 * exactly `--apply --reset --confirm-reset=RESET-SEED-DATA`, in any order.
 *
 * The accepted spellings are `--dry-run`, `--apply`, `--reset`,
 * `--confirm-reset=VALUE`, `--verbose`, `--help`, and `-h`. All other flags,
 * positional arguments, separators, values, and duplicate semantic flags are
 * rejected. Errors describe the invalid condition without repeating supplied
 * values.
 *
 * @param capabilities Optional behaviors this script supports. Omitted means
 *   only universal dry-run/apply modes are accepted.
 * @param argv Argument vector to scan. Defaults to `process.argv.slice(2)`.
 * @returns The parsed {@link SeedFlags}.
 *
 * @example
 *   import { parseSeedFlags } from './lib/cli';
 *   const { dryRun, reset } = parseSeedFlags({ reset: true });
 */
export function parseSeedFlags(
	capabilities: SeedFlagCapabilities = {},
	argv: readonly string[] = process.argv.slice(2),
): SeedFlags {
	const seen = new Set<string>();
	let apply = false;
	let dryRun = false;
	let reset = false;
	let verbose = false;
	let help = false;
	let confirmation: string | undefined;

	const markSeen = (flag: string): void => {
		if (seen.has(flag)) {
			throw new Error(`Invalid seed CLI flags: duplicate ${flag}.`);
		}
		seen.add(flag);
	};

	for (const arg of argv) {
		if (arg === '--') {
			throw new Error('Invalid seed CLI argument: -- is not supported.');
		}
		if (!arg.startsWith('-')) {
			throw new Error('Invalid seed CLI argument: positional arguments are not supported.');
		}

		switch (arg) {
			case '--dry-run':
				markSeen('--dry-run');
				dryRun = true;
				break;
			case '--apply':
				markSeen('--apply');
				apply = true;
				break;
			case '--reset':
				markSeen('--reset');
				if (!capabilities.reset) {
					throw new Error('Invalid seed CLI flag: --reset is not supported by this script.');
				}
				reset = true;
				break;
			case '--verbose':
				markSeen('--verbose');
				if (!capabilities.verbose) {
					throw new Error('Invalid seed CLI flag: --verbose is not supported by this script.');
				}
				verbose = true;
				break;
			case '--help':
			case '-h':
				markSeen('--help');
				if (!capabilities.help) {
					throw new Error('Invalid seed CLI flag: --help is not supported by this script.');
				}
				help = true;
				break;
			default:
				if (arg.startsWith('--confirm-reset=')) {
					markSeen('--confirm-reset');
					if (!capabilities.reset) {
						throw new Error(
							'Invalid seed CLI flag: --confirm-reset is not supported by this script.',
						);
					}
					confirmation = arg.slice('--confirm-reset='.length);
					break;
				}
				throw new Error('Invalid seed CLI flag: only exact supported flags are allowed.');
		}
	}

	if (help) {
		if (argv.length !== 1) {
			throw new Error('Invalid seed CLI flags: help must be used alone.');
		}
		return { dryRun: true, reset: false, verbose: false, help: true };
	}

	if (apply && dryRun) {
		throw new Error('Invalid seed CLI flags: --apply and --dry-run cannot be combined.');
	}

	if (reset) {
		if (!apply) {
			throw new Error('Invalid seed CLI reset: --reset requires --apply.');
		}
		if (confirmation === undefined) {
			throw new Error('Invalid seed CLI reset: --reset requires one confirmation.');
		}
		if (confirmation !== RESET_SEED_DATA_CONFIRMATION) {
			throw new Error('Invalid seed CLI reset: confirmation is invalid.');
		}
		if (argv.length !== 3) {
			throw new Error(
				'Invalid seed CLI reset: reset may only be combined with --apply and one confirmation.',
			);
		}
	} else if (confirmation !== undefined) {
		throw new Error('Invalid seed CLI reset: confirmation requires --reset.');
	}

	return { dryRun: !apply, reset, verbose, help: false };
}
