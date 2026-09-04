import { describe, expect, it } from 'bun:test';
import { parseSeedFlags, runMain } from './cli';

describe('runMain', () => {
	// Regression (2026-07-02, pipeline-safety slice): runMain used to test
	// import.meta.main INSIDE lib/cli.ts, which is never the process
	// entrypoint, so main() never ran: every runMain-based ops script was a
	// silent no-op (exit 0, zero output). The caller must pass its own
	// import.meta.
	it('runs main when the caller is the entrypoint (meta.main true)', async () => {
		let ran = 0;
		runMain(() => {
			ran += 1;
		}, { main: true } as ImportMeta);
		await Bun.sleep(0);
		expect(ran).toBe(1);
	});

	it('does not run main when the caller is imported (meta.main false)', async () => {
		let ran = 0;
		runMain(() => {
			ran += 1;
		}, { main: false } as ImportMeta);
		await Bun.sleep(0);
		expect(ran).toBe(0);
	});
});

describe('parseSeedFlags', () => {
	const none = {};
	const reset = { reset: true };
	const verbose = { verbose: true };
	const help = { help: true };
	const all = { reset: true, verbose: true, help: true };

	it.each([
		{
			name: 'defaults to dry-run instead of permitting writes',
			capabilities: none,
			argv: [],
			want: { dryRun: true, reset: false, verbose: false, help: false },
		},
		{
			name: 'keeps explicit dry-run in dry-run mode instead of treating it as unknown',
			capabilities: none,
			argv: ['--dry-run'],
			want: { dryRun: true, reset: false, verbose: false, help: false },
		},
		{
			name: 'permits explicit apply instead of leaving it in dry-run mode',
			capabilities: none,
			argv: ['--apply'],
			want: { dryRun: false, reset: false, verbose: false, help: false },
		},
		{
			name: 'permits reset confirmation in every argument order instead of requiring one order',
			capabilities: reset,
			argv: ['--apply', '--reset', '--confirm-reset=RESET-SEED-DATA'],
			want: { dryRun: false, reset: true, verbose: false, help: false },
		},
		{
			name: 'permits reset confirmation after apply and before reset instead of requiring adjacency',
			capabilities: reset,
			argv: ['--apply', '--confirm-reset=RESET-SEED-DATA', '--reset'],
			want: { dryRun: false, reset: true, verbose: false, help: false },
		},
		{
			name: 'permits reset confirmation before apply instead of requiring apply first',
			capabilities: reset,
			argv: ['--reset', '--apply', '--confirm-reset=RESET-SEED-DATA'],
			want: { dryRun: false, reset: true, verbose: false, help: false },
		},
		{
			name: 'permits reset confirmation before apply and reset instead of requiring a prefix',
			capabilities: reset,
			argv: ['--confirm-reset=RESET-SEED-DATA', '--apply', '--reset'],
			want: { dryRun: false, reset: true, verbose: false, help: false },
		},
		{
			name: 'permits reset between confirmation and apply instead of requiring adjacent confirmation',
			capabilities: reset,
			argv: ['--confirm-reset=RESET-SEED-DATA', '--reset', '--apply'],
			want: { dryRun: false, reset: true, verbose: false, help: false },
		},
		{
			name: 'permits reset before confirmation and apply instead of requiring confirmation last',
			capabilities: reset,
			argv: ['--reset', '--confirm-reset=RESET-SEED-DATA', '--apply'],
			want: { dryRun: false, reset: true, verbose: false, help: false },
		},
		{
			name: 'permits verbose dry-run instead of rejecting a supported diagnostic flag',
			capabilities: verbose,
			argv: ['--dry-run', '--verbose'],
			want: { dryRun: true, reset: false, verbose: true, help: false },
		},
		{
			name: 'permits verbose apply instead of discarding supported diagnostics',
			capabilities: verbose,
			argv: ['--apply', '--verbose'],
			want: { dryRun: false, reset: false, verbose: true, help: false },
		},
		{
			name: 'permits standalone verbose in default dry-run mode instead of requiring an explicit mode',
			capabilities: verbose,
			argv: ['--verbose'],
			want: { dryRun: true, reset: false, verbose: true, help: false },
		},
		{
			name: 'permits long help alone instead of trying to apply it',
			capabilities: help,
			argv: ['--help'],
			want: { dryRun: true, reset: false, verbose: false, help: true },
		},
		{
			name: 'permits short help alone instead of treating it as an unknown alias',
			capabilities: help,
			argv: ['-h'],
			want: { dryRun: true, reset: false, verbose: false, help: true },
		},
	])('$name', ({ capabilities, argv, want }) => {
		expect(parseSeedFlags(capabilities, argv)).toEqual(want);
	});

	it.each([
		{
			name: 'rejects positional arguments instead of accepting an accidental value',
			capabilities: none,
			argv: ['fixture.json'],
			error: 'Invalid seed CLI argument: positional arguments are not supported.',
		},
		{
			name: 'rejects a bare separator instead of silently accepting trailing arguments',
			capabilities: none,
			argv: ['--'],
			error: 'Invalid seed CLI argument: -- is not supported.',
		},
		{
			name: 'rejects unknown flags instead of accepting an unreviewed mode',
			capabilities: none,
			argv: ['--force'],
			error: 'Invalid seed CLI flag: only exact supported flags are allowed.',
		},
		{
			name: 'rejects malformed value variants instead of normalizing them',
			capabilities: none,
			argv: ['--apply=true'],
			error: 'Invalid seed CLI flag: only exact supported flags are allowed.',
		},
		{
			name: 'rejects split confirmations instead of accepting a secret as a positional value',
			capabilities: reset,
			argv: ['--apply', '--reset', '--confirm-reset', 'RESET-SEED-DATA'],
			error: 'Invalid seed CLI flag: only exact supported flags are allowed.',
		},
		{
			name: 'rejects reset without capability instead of granting destructive access',
			capabilities: none,
			argv: ['--apply', '--reset', '--confirm-reset=RESET-SEED-DATA'],
			error: 'Invalid seed CLI flag: --reset is not supported by this script.',
		},
		{
			name: 'rejects reset confirmation without capability instead of accepting destructive syntax',
			capabilities: none,
			argv: ['--confirm-reset=RESET-SEED-DATA'],
			error: 'Invalid seed CLI flag: --confirm-reset is not supported by this script.',
		},
		{
			name: 'rejects verbose without capability instead of enabling unsupported logging',
			capabilities: none,
			argv: ['--verbose'],
			error: 'Invalid seed CLI flag: --verbose is not supported by this script.',
		},
		{
			name: 'rejects help without capability instead of allowing a silent no-op',
			capabilities: none,
			argv: ['--help'],
			error: 'Invalid seed CLI flag: --help is not supported by this script.',
		},
		{
			name: 'rejects duplicate reset without capability before reflecting destructive input',
			capabilities: none,
			argv: ['--reset', '--reset'],
			error: 'Invalid seed CLI flag: --reset is not supported by this script.',
		},
		{
			name: 'rejects duplicate exact confirmations without capability before reflecting consent input',
			capabilities: none,
			argv: ['--confirm-reset=RESET-SEED-DATA', '--confirm-reset=RESET-SEED-DATA'],
			error: 'Invalid seed CLI flag: --confirm-reset is not supported by this script.',
		},
		{
			name: 'rejects duplicate verbose without capability before reflecting diagnostic input',
			capabilities: none,
			argv: ['--verbose', '--verbose'],
			error: 'Invalid seed CLI flag: --verbose is not supported by this script.',
		},
		{
			name: 'rejects duplicate long help without capability before reflecting help input',
			capabilities: none,
			argv: ['--help', '--help'],
			error: 'Invalid seed CLI flag: --help is not supported by this script.',
		},
		{
			name: 'rejects duplicate short help without capability before reflecting help input',
			capabilities: none,
			argv: ['-h', '-h'],
			error: 'Invalid seed CLI flag: --help is not supported by this script.',
		},
		{
			name: 'rejects mixed help aliases without capability before treating them as duplicates',
			capabilities: none,
			argv: ['--help', '-h'],
			error: 'Invalid seed CLI flag: --help is not supported by this script.',
		},
		{
			name: 'rejects duplicate dry-run instead of accepting ambiguous modes',
			capabilities: none,
			argv: ['--dry-run', '--dry-run'],
			error: 'Invalid seed CLI flags: duplicate --dry-run.',
		},
		{
			name: 'rejects duplicate apply instead of accepting repeated write opt-in',
			capabilities: none,
			argv: ['--apply', '--apply'],
			error: 'Invalid seed CLI flags: duplicate --apply.',
		},
		{
			name: 'rejects duplicate reset instead of accepting repeated destructive intent',
			capabilities: reset,
			argv: ['--apply', '--reset', '--reset', '--confirm-reset=RESET-SEED-DATA'],
			error: 'Invalid seed CLI flags: duplicate --reset.',
		},
		{
			name: 'rejects duplicate confirmations instead of accepting ambiguous reset consent',
			capabilities: reset,
			argv: [
				'--apply',
				'--reset',
				'--confirm-reset=RESET-SEED-DATA',
				'--confirm-reset=RESET-SEED-DATA',
			],
			error: 'Invalid seed CLI flags: duplicate --confirm-reset.',
		},
		{
			name: 'rejects duplicate verbose instead of accepting repeated diagnostics',
			capabilities: verbose,
			argv: ['--verbose', '--verbose'],
			error: 'Invalid seed CLI flags: duplicate --verbose.',
		},
		{
			name: 'rejects duplicate help aliases instead of treating them as distinct flags',
			capabilities: help,
			argv: ['--help', '-h'],
			error: 'Invalid seed CLI flags: duplicate --help.',
		},
		{
			name: 'rejects apply plus dry-run instead of selecting an unsafe precedence',
			capabilities: none,
			argv: ['--apply', '--dry-run'],
			error: 'Invalid seed CLI flags: --apply and --dry-run cannot be combined.',
		},
		{
			name: 'rejects help combinations instead of running any operational mode',
			capabilities: all,
			argv: ['--help', '--apply'],
			error: 'Invalid seed CLI flags: help must be used alone.',
		},
		{
			name: 'rejects reset without apply instead of permitting destructive dry-run syntax',
			capabilities: reset,
			argv: ['--reset', '--confirm-reset=RESET-SEED-DATA'],
			error: 'Invalid seed CLI reset: --reset requires --apply.',
		},
		{
			name: 'rejects reset without confirmation instead of assuming consent',
			capabilities: reset,
			argv: ['--apply', '--reset'],
			error: 'Invalid seed CLI reset: --reset requires one confirmation.',
		},
		{
			name: 'rejects wrong confirmation instead of accepting a near match',
			capabilities: reset,
			argv: ['--apply', '--reset', '--confirm-reset=wrong'],
			error: 'Invalid seed CLI reset: confirmation is invalid.',
		},
		{
			name: 'rejects confirmation without reset instead of treating it as an apply opt-in',
			capabilities: reset,
			argv: ['--apply', '--confirm-reset=RESET-SEED-DATA'],
			error: 'Invalid seed CLI reset: confirmation requires --reset.',
		},
		{
			name: 'rejects verbose with reset instead of widening the exact destructive command',
			capabilities: all,
			argv: ['--apply', '--reset', '--confirm-reset=RESET-SEED-DATA', '--verbose'],
			error: 'Invalid seed CLI reset: reset may only be combined with --apply and one confirmation.',
		},
	])('$name', ({ capabilities, argv, error }) => {
		expect(() => parseSeedFlags(capabilities, argv)).toThrow(error);
	});
});
