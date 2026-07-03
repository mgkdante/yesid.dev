// Doctrine gate: svelte-check must report ZERO warnings. svelte-check exits 0
// when only warnings exist (--fail-on-warnings defaults to false), so a bare
// `svelte-check` in the `check` script never trips CI on warning regrowth.
// This wrapper IS the check (single svelte-check run, no double pass): it runs
// svelte-check with --output machine-verbose (one JSON diagnostic per line,
// each carrying a `code` field), defers to svelte-check's own exit code for
// ERRORS, and locks WARNINGS at SVELTE_CHECK_MAX_WARNINGS (default 0).
// Triage lever (same pattern as ENGINE_CHUNK_BUDGET_GZIP): raise the env var
// temporarily when a Svelte/bits-ui upgrade lands new upstream warnings
// mid-branch, then drive it back to 0.

import { spawnSync } from 'node:child_process';

const MAX_WARNINGS = Number(process.env.SVELTE_CHECK_MAX_WARNINGS ?? 0);

const result = spawnSync(
	'bunx',
	['svelte-check', '--tsconfig', './tsconfig.json', '--output', 'machine-verbose'],
	{ encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
);
const out = `${result.stdout ?? ''}${result.stderr ?? ''}`;
process.stdout.write(out);

// machine-verbose lines are `<timestamp> <JSON>`; anything else (START,
// COMPLETED, plain logs) is skipped.
const diags = out.split('\n').flatMap((line) => {
	const json = line.slice(line.indexOf(' ') + 1);
	if (!json.startsWith('{')) return [];
	try {
		return [JSON.parse(json)];
	} catch {
		return [];
	}
});
const warnings = diags.filter((d) => d.type === 'WARNING');

// Errors: defer to svelte-check's own exit code (non-zero on ERRORS).
if (result.status !== 0) process.exit(result.status ?? 1);

if (warnings.length > MAX_WARNINGS) {
	console.error(`FAIL: ${warnings.length} svelte-check warning(s) > lock ${MAX_WARNINGS}:`);
	for (const w of warnings) {
		console.error(
			`  ${w.filename}:${w.start.line + 1}:${w.start.character + 1} ${w.code}: ${w.message.split('\n')[0]}`
		);
	}
	process.exit(1);
}
console.log(`OK: svelte-check warnings ${warnings.length} <= lock ${MAX_WARNINGS}`);
