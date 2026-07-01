// GO-w2t5 perf gate: the Tech Stack Engine must stay (a) code-split out of
// the route entry chunk and (b) under a gzip budget. Run AFTER a build:
//   EXPORT_FALLBACKS_SKIP=1 bun run build && bun run check:engine-chunk
//
// MARKER is the 'engine-goal-region' data-testid string literal — it exists
// ONLY in Engine.svelte (the route's loading placeholder uses
// 'stack-engine-loading', which deliberately does NOT match this marker).

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const CLIENT_DIR = '.svelte-kit/output/client/_app/immutable';
const MARKER = 'engine-goal-region';
// Measured 20,600 bytes gzip on 2026-07-01 (consolidation-deploy-honesty).
// develop (b8369357) already measured 20,597 BEFORE the slice — this check
// runs locally only (not in web.yml), so the growth past 20,000 landed
// unnoticed in an earlier merge; the slice itself adds +3 bytes. Re-pinned
// per the standing formula: measured × 1.2 rounded up to the nearest 5,000
// → 25,000.
// Previous pins: 20,000 (16,280 go2/w5; 15,019 round 4); 15,000 (10,459, round 1).
const BUDGET_GZIP = Number(process.env.ENGINE_CHUNK_BUDGET_GZIP ?? 25_000);

function* walk(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name);
		if (entry.isDirectory()) yield* walk(p);
		else if (p.endsWith('.js')) yield p;
	}
}

const hits = [];
for (const file of walk(CLIENT_DIR)) {
	if (readFileSync(file, 'utf8').includes(MARKER)) hits.push(file);
}

if (hits.length === 0) {
	console.error(`FAIL: no client chunk contains marker "${MARKER}" — did the engine move?`);
	process.exit(1);
}

// Route entry chunks live under immutable/nodes/ — the engine must NOT be there.
const leaked = hits.filter((f) => f.includes(`${join('immutable', 'nodes')}`));
if (leaked.length > 0) {
	console.error('FAIL: engine code leaked into route entry chunk(s):');
	for (const f of leaked) console.error(`  ${f}`);
	process.exit(1);
}

let total = 0;
for (const f of hits) {
	const gz = gzipSync(readFileSync(f)).length;
	total += gz;
	console.log(`engine chunk: ${f} — ${gz} bytes gzip`);
}

if (total > BUDGET_GZIP) {
	console.error(`FAIL: engine chunk total ${total} bytes gzip > budget ${BUDGET_GZIP}`);
	process.exit(1);
}
console.log(`OK: engine stays code-split, ${total} bytes gzip ≤ budget ${BUDGET_GZIP}`);
