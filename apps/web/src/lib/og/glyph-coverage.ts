import { readFileSync } from 'node:fs';

// The bundled TrueType fonts use Unicode cmap formats 4 (BMP) and 12.
// Read glyph IDs directly: measuring .notdef still returns a plausible box.
function unicodeMaps(file: string): ((code: number) => boolean)[] {
	const data = readFileSync(file);
	const maps: ((code: number) => boolean)[] = [];
	for (let table = 0; table < data.readUInt16BE(4); table += 1) {
		const entry = 12 + table * 16;
		if (data.toString('ascii', entry, entry + 4) !== 'cmap') continue;
		const cmap = data.readUInt32BE(entry + 8);
		for (let index = 0; index < data.readUInt16BE(cmap + 2); index += 1) {
			const record = cmap + 4 + index * 8;
			const platform = data.readUInt16BE(record);
			const encoding = data.readUInt16BE(record + 2);
			if (platform !== 0 && !(platform === 3 && (encoding === 1 || encoding === 10))) continue;
			const offset = cmap + data.readUInt32BE(record + 4);
			const format = data.readUInt16BE(offset);
			if (format === 4) maps.push(bmpCoverage(data, offset));
			if (format === 12) maps.push(fullCoverage(data, offset));
		}
	}
	if (!maps.length) throw new Error(`No supported Unicode cmap in OG font ${file}`);
	return maps;
}

function bmpCoverage(data: Buffer, offset: number): (code: number) => boolean {
	const count = data.readUInt16BE(offset + 6) / 2;
	return (code) => {
		if (code > 0xffff) return false;
		for (let index = 0; index < count; index += 1) {
			if (code > data.readUInt16BE(offset + 14 + index * 2)) continue;
			const start = data.readUInt16BE(offset + 16 + count * 2 + index * 2);
			if (code < start) return false;
			const delta = data.readInt16BE(offset + 16 + count * 4 + index * 2);
			const address = offset + 16 + count * 6 + index * 2;
			const range = data.readUInt16BE(address);
			const glyph = range ? data.readUInt16BE(address + range + (code - start) * 2) : code;
			return (range === 0 || glyph !== 0) && ((glyph + delta) & 0xffff) !== 0;
		}
		return false;
	};
}

function fullCoverage(data: Buffer, offset: number): (code: number) => boolean {
	return (code) => {
		for (let index = 0; index < data.readUInt32BE(offset + 12); index += 1) {
			const group = offset + 16 + index * 12;
			const start = data.readUInt32BE(group);
			if (code < start) return false;
			if (code <= data.readUInt32BE(group + 4)) return data.readUInt32BE(group + 8) + code - start !== 0;
		}
		return false;
	};
}

export function createGlyphCoverage(fontFiles: readonly string[]): (text: string) => string[] {
	const fonts = fontFiles.map(unicodeMaps);
	const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
	const supported = new Map<string, boolean>();
	return (text) => [...new Set(Array.from(graphemes.segment(text), ({ segment }) => segment))].filter((segment) => {
		if (/^\s+$/u.test(segment)) return false;
		if (!supported.has(segment)) {
			const codes = Array.from(segment, (character) => character.codePointAt(0)!);
			supported.set(segment, fonts.some((maps) => codes.every((code) => maps.some((has) => has(code)))));
		}
		return !supported.get(segment);
	});
}
