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
	it('parses the standard seed flags', () => {
		expect(parseSeedFlags(['--dry-run', '--reset'])).toEqual({
			dryRun: true,
			reset: true,
			verbose: false,
			help: false,
		});
		expect(parseSeedFlags([])).toEqual({
			dryRun: false,
			reset: false,
			verbose: false,
			help: false,
		});
		expect(parseSeedFlags(['-h'])).toEqual({
			dryRun: false,
			reset: false,
			verbose: false,
			help: true,
		});
	});
});
