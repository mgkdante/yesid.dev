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
// Measured 10,459 bytes gzip on 2026-06-12 (go2/w5 engine 2.0 layered
// learning: legend, teach line, build counter, stable grid, zero-match shape
// composer, pair notes, row labels, drafting furniture — all engine-chunk
// teaching UI; GSAP Flip still rides the shared chunks, not this one).
// Pinned to measured × 1.2 rounded up to the nearest 5,000.
// Previous pin: 10,000 (measured 7,266 on 2026-06-11, GO-w2t5 final state).
const BUDGET_GZIP = Number(process.env.ENGINE_CHUNK_BUDGET_GZIP ?? 15_000);

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
