import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const CLIENT_DIR = resolve('.svelte-kit/output/client');
const MANIFEST_PATH = resolve(CLIENT_DIR, '.vite/manifest.json');
const MANIFEST_DISPLAY_PATH = '.svelte-kit/output/client/.vite/manifest.json';
const ROOT_KEY = '.svelte-kit/generated/client-optimized/nodes/0.js';
const ENGINE_KEY = 'src/lib/components/stack-engine/Engine.svelte';

function fail(message) {
	console.error(`FAIL: ${message}`);
	process.exit(1);
}

function budget(name, fallback) {
	const value = process.env[name];
	if (value === undefined) return fallback;
	const parsed = Number(value);
	if (value.trim() === '' || !Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
		fail(`${name} must be a finite positive integer`);
	}
	return parsed;
}

const budgets = {
	rootEntry: budget('ROOT_LAYOUT_ENTRY_BUDGET_GZIP', 30_000),
	rootPayload: budget('ROOT_LAYOUT_PAYLOAD_BUDGET_GZIP', 180_000),
	engine: budget('ENGINE_CHUNK_BUDGET_GZIP', 90_000),
};

let manifestSource;
try {
	manifestSource = readFileSync(MANIFEST_PATH, 'utf8');
} catch {
	fail(`cannot read ${MANIFEST_DISPLAY_PATH}`);
}

let manifest;
try {
	manifest = JSON.parse(manifestSource);
} catch {
	fail('malformed client manifest JSON');
}

if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) {
	fail('client manifest must be a JSON object');
}

function requiredRecord(key, label) {
	const record = manifest[key];
	if (record === undefined) fail(`missing ${label} manifest record: ${key}`);
	if (record === null || typeof record !== 'object' || Array.isArray(record)) {
		fail(`invalid ${label} manifest record: ${key}`);
	}
	if (typeof record.file !== 'string' || record.file.length === 0) {
		fail(`invalid ${label} manifest output: ${key}`);
	}
	return record;
}

function importKeys(record, key) {
	if (record.imports === undefined) return [];
	if (
		!Array.isArray(record.imports) ||
		record.imports.some((importKey) => typeof importKey !== 'string' || importKey.length === 0)
	) {
		fail(`invalid static imports for manifest record: ${key}`);
	}
	return record.imports;
}

function importRecord(key) {
	const record = manifest[key];
	if (record === undefined) fail(`missing manifest record for static import: ${key}`);
	if (record === null || typeof record !== 'object' || Array.isArray(record)) {
		fail(`invalid manifest record for static import: ${key}`);
	}
	if (typeof record.file !== 'string' || record.file.length === 0) {
		fail(`invalid output for static import: ${key}`);
	}
	return record;
}

function outputPath(file, label) {
	if (!file.endsWith('.js')) fail(`${label} manifest output is not JavaScript: ${file}`);
	const path = resolve(CLIENT_DIR, file);
	const fromClient = relative(CLIENT_DIR, path);
	if (fromClient.startsWith('..') || isAbsolute(fromClient)) {
		fail(`${label} output escapes the client directory`);
	}
	return path;
}

const outputContents = new Map();

function readOutput(file, label) {
	const path = outputPath(file, label);
	if (!outputContents.has(path)) {
		let content;
		try {
			content = readFileSync(path);
		} catch {
			fail(`cannot read ${label} output: ${file}`);
		}
		outputContents.set(path, content);
	}
	return { path, content: outputContents.get(path) };
}

function measureContent(content) {
	return { raw: content.length, gzip: gzipSync(content).length };
}

function collectStaticClosure(entryKey, entryRecord, entryLabel) {
	const outputs = new Map();
	const keys = new Set();
	const pending = [{ key: entryKey, record: entryRecord, depth: 0 }];

	while (pending.length > 0) {
		const current = pending.pop();
		if (keys.has(current.key)) continue;
		keys.add(current.key);

		const record =
			current.depth === 0 ? current.record : importRecord(current.key);
		const imports = importKeys(record, current.key);
		const label =
			current.depth === 0
				? entryLabel
				: entryLabel === 'root layout' && current.depth === 1
					? 'direct static import'
					: 'static import graph';
		const output = readOutput(record.file, label);
		if (!outputs.has(output.path)) {
			outputs.set(output.path, { file: record.file, content: output.content });
		}

		for (const key of imports) {
			pending.push({ key, record: undefined, depth: current.depth + 1 });
		}
	}

	return { keys, outputs };
}

function measureOutputs(outputs) {
	const total = { raw: 0, gzip: 0 };
	for (const { content } of outputs.values()) {
		total.raw += content.length;
		total.gzip += gzipSync(content).length;
	}
	return total;
}

const root = requiredRecord(ROOT_KEY, 'root layout');
const engine = requiredRecord(ENGINE_KEY, 'engine');

if (engine.isDynamicEntry !== true) fail(`${ENGINE_KEY} is not a dynamic entry`);
if (/(^|\/)nodes\//.test(engine.file)) fail('engine output is a route node');

const rootClosure = collectStaticClosure(ROOT_KEY, root, 'root layout');
const rootPath = outputPath(root.file, 'root layout');
const rootEntry = measureContent(rootClosure.outputs.get(rootPath).content);
const enginePath = outputPath(engine.file, 'engine');
if (rootClosure.keys.has(ENGINE_KEY) || rootClosure.outputs.has(enginePath)) {
	fail('engine is statically reachable from the root layout');
}
const payload = measureOutputs(rootClosure.outputs);
const engineClosure = collectStaticClosure(ENGINE_KEY, engine, 'engine');
const engineIncrementalOutputs = new Map(
	[...engineClosure.outputs].filter(([path]) => !rootClosure.outputs.has(path)),
);
const enginePayload = measureOutputs(engineIncrementalOutputs);
const rootImportCount = rootClosure.outputs.size - 1;

console.log(
	`root layout entry: ${root.file} — ${rootEntry.raw} bytes raw, ${rootEntry.gzip} bytes gzip (budget ${budgets.rootEntry})`,
);
console.log(
	`root layout payload: ${rootClosure.outputs.size} files (${rootImportCount} static ${rootImportCount === 1 ? 'import' : 'imports'}) — ${payload.raw} bytes raw, ${payload.gzip} bytes gzip (budget ${budgets.rootPayload})`,
);
console.log(
	`engine incremental payload: ${engineIncrementalOutputs.size} ${engineIncrementalOutputs.size === 1 ? 'file' : 'files'} — ${enginePayload.raw} bytes raw, ${enginePayload.gzip} bytes gzip (budget ${budgets.engine})`,
);

if (rootEntry.gzip > budgets.rootEntry) {
	fail(
		`root layout entry ${rootEntry.gzip} bytes gzip > budget ${budgets.rootEntry} bytes gzip`,
	);
}
if (payload.gzip > budgets.rootPayload) {
	fail(`root layout payload ${payload.gzip} bytes gzip > budget ${budgets.rootPayload} bytes gzip`);
}
if (enginePayload.gzip > budgets.engine) {
	fail(
		`engine incremental payload ${enginePayload.gzip} bytes gzip > budget ${budgets.engine} bytes gzip`,
	);
}

console.log('OK: client payload budgets pass');
