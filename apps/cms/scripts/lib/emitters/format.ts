/**
 * Deterministic TypeScript value serializer for the export-fallbacks pipeline.
 *
 * Emits plain JS object literals using:
 *   - single quotes for strings (matches repo style)
 *   - alphabetically sorted object keys (idempotency)
 *   - preserved array order (semantic)
 *   - tab indentation
 *   - trailing commas
 *   - inline format for short primitive arrays + LocalizedString-style objects;
 *     multiline for everything else
 *
 * No prettier dependency — pure custom logic. Run twice on the same data and
 * the byte output is identical (P4 idempotency acceptance criterion).
 */

const TAB = '\t';
const INLINE_THRESHOLD = 60; // chars; switch to multiline if a single-line form exceeds this

const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function emitKey(key: string): string {
	return IDENT_RE.test(key) ? key : emitString(key);
}

function emitString(s: string): string {
	// Single-quote strings; escape backslashes, single quotes, and template-literal characters.
	const escaped = s
		.replace(/\\/g, '\\\\')
		.replace(/'/g, "\\'")
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r')
		.replace(/\t/g, '\\t');
	return `'${escaped}'`;
}

function emitPrimitive(v: unknown): string {
	if (v === null) return 'null';
	if (v === undefined) return 'undefined';
	if (typeof v === 'string') return emitString(v);
	if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'null';
	if (typeof v === 'boolean') return String(v);
	throw new Error(`emitPrimitive: unsupported value type ${typeof v}`);
}

function isPrimitive(v: unknown): boolean {
	return v === null || v === undefined || typeof v !== 'object';
}

/**
 * Recursive value emitter. Returns serialized form WITHOUT trailing newline.
 * `indent` is the current indentation level (number of tabs to prepend on
 * each child line). The caller is responsible for the leading indent of the
 * first line.
 */
export function emitValue(v: unknown, indent = 0): string {
	if (isPrimitive(v)) return emitPrimitive(v);

	if (Array.isArray(v)) {
		if (v.length === 0) return '[]';
		// Inline if all primitives AND total length under threshold.
		if (v.every(isPrimitive)) {
			const inline = `[${v.map(emitPrimitive).join(', ')}]`;
			if (inline.length <= INLINE_THRESHOLD) return inline;
		}
		const childIndent = TAB.repeat(indent + 1);
		const closeIndent = TAB.repeat(indent);
		const items = v.map((item) => `${childIndent}${emitValue(item, indent + 1)},`).join('\n');
		return `[\n${items}\n${closeIndent}]`;
	}

	if (typeof v === 'object') {
		const obj = v as Record<string, unknown>;
		const keys = Object.keys(obj).sort();
		if (keys.length === 0) return '{}';

		// Drop keys whose value is `undefined` so they don't appear in the output
		// (matches the runtime LocalizedString convention: optional locales absent).
		const presentKeys = keys.filter((k) => obj[k] !== undefined);
		if (presentKeys.length === 0) return '{}';

		// Inline form: only for LocalizedString-shape objects (en + optional fr/es)
		// or other tiny objects where all values are primitives.
		const allPrimitive = presentKeys.every((k) => isPrimitive(obj[k]));
		if (allPrimitive) {
			const inline = `{ ${presentKeys.map((k) => `${emitKey(k)}: ${emitPrimitive(obj[k])}`).join(', ')} }`;
			if (inline.length <= INLINE_THRESHOLD) return inline;
		}

		const childIndent = TAB.repeat(indent + 1);
		const closeIndent = TAB.repeat(indent);
		const entries = presentKeys
			.map((k) => `${childIndent}${emitKey(k)}: ${emitValue(obj[k], indent + 1)},`)
			.join('\n');
		return `{\n${entries}\n${closeIndent}}`;
	}

	throw new Error(`emitValue: unsupported value type ${typeof v}`);
}

/**
 * Top-level emit: `export const <name>: <typeName> = <serialized>;`.
 * Indent starts at 0; the value's outermost braces sit on column 0.
 */
export function emitExport(name: string, typeName: string, value: unknown): string {
	const serialized = emitValue(value, 0);
	return `export const ${name}: ${typeName} = ${serialized};`;
}
