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
	engine: budget('ENGINE_CHUNK_BUDGET_GZIP', 25_000),
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
	if (outputContents.has(path)) return outputContents.get(path);
	let content;
	try {
		content = readFileSync(path);
	} catch {
		fail(`cannot read ${label} output: ${file}`);
	}
	outputContents.set(path, content);
	return content;
}

function measure(file, label) {
	const content = readOutput(file, label);
	return { raw: content.length, gzip: gzipSync(content).length };
}

const root = requiredRecord(ROOT_KEY, 'root layout');
const engine = requiredRecord(ENGINE_KEY, 'engine');

if (engine.isDynamicEntry !== true) fail(`${ENGINE_KEY} is not a dynamic entry`);
if (/(^|\/)nodes\//.test(engine.file)) fail('engine output is a route node');

const rootDirectImports = importKeys(root, ROOT_KEY);
const rootDirectImportKeys = new Set(rootDirectImports);
const directJsFiles = new Set();
for (const key of rootDirectImports) {
	const record = importRecord(key);
	if (record.file.endsWith('.js') && record.file !== root.file) directJsFiles.add(record.file);
}

const visited = new Set();
const pending = [...rootDirectImports];
while (pending.length > 0) {
	const key = pending.pop();
	if (visited.has(key)) continue;
	visited.add(key);
	const record = importRecord(key);
	readOutput(
		record.file,
		rootDirectImportKeys.has(key) ? 'direct static import' : 'static import graph',
	);
	if (key === ENGINE_KEY || record.file === engine.file) {
		fail('engine is statically reachable from the root layout');
	}
	pending.push(...importKeys(record, key));
}

const rootEntry = measure(root.file, 'root layout');
const payload = { ...rootEntry };
for (const file of directJsFiles) {
	const chunk = measure(file, 'direct static import');
	payload.raw += chunk.raw;
	payload.gzip += chunk.gzip;
}
const engineEntry = measure(engine.file, 'engine');

console.log(
	`root layout entry: ${root.file} — ${rootEntry.raw} bytes raw, ${rootEntry.gzip} bytes gzip (budget ${budgets.rootEntry})`,
);
console.log(
	`root layout payload: ${directJsFiles.size + 1} files (${directJsFiles.size} direct static ${directJsFiles.size === 1 ? 'import' : 'imports'}) — ${payload.raw} bytes raw, ${payload.gzip} bytes gzip (budget ${budgets.rootPayload})`,
);
console.log(
	`engine dynamic entry: ${engine.file} — ${engineEntry.raw} bytes raw, ${engineEntry.gzip} bytes gzip (budget ${budgets.engine})`,
);

if (rootEntry.gzip > budgets.rootEntry) {
	fail(
		`root layout entry ${rootEntry.gzip} bytes gzip > budget ${budgets.rootEntry} bytes gzip`,
	);
}
if (payload.gzip > budgets.rootPayload) {
	fail(`root layout payload ${payload.gzip} bytes gzip > budget ${budgets.rootPayload} bytes gzip`);
}
if (engineEntry.gzip > budgets.engine) {
	fail(`engine dynamic entry ${engineEntry.gzip} bytes gzip > budget ${budgets.engine} bytes gzip`);
}

console.log('OK: client payload budgets pass');
