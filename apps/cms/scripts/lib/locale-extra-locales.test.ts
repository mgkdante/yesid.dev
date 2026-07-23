import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import {
	toLocalizedJSON,
	toLocalizedString,
	toLocalizedStringNullable,
	toLocalizedStringOrUndef,
} from './locale';

const REPO_ROOT = resolve(import.meta.dir, '../../../..');

function filesBelow(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true })
		.flatMap((entry) => {
			const path = join(directory, entry.name);
			return entry.isDirectory() ? filesBelow(path) : [path];
		})
		.sort();
}

function sha256(bytes: string | Buffer): string {
	return createHash('sha256').update(bytes).digest('hex');
}

function aggregateSha256(directory: string): string {
	const lines = filesBelow(directory).map(
		(path) => `${sha256(readFileSync(path))}  ${relative(REPO_ROOT, path)}\n`,
	);
	return sha256(lines.join(''));
}

describe('ordered extra-locale loop', () => {
	test('uses one ordered locale registry in both localized emitters', () => {
		const source = readFileSync(join(import.meta.dir, 'locale.ts'), 'utf8');
		expect(source.match(/const EXTRA_LOCALES = \['fr', 'es'\] as const;/g) ?? []).toHaveLength(1);
		expect(source.match(/for \(const locale of EXTRA_LOCALES\)/g) ?? []).toHaveLength(2);
	});

	test('keeps en -> fr -> es order and sparse omission independent of row order', () => {
		const rows = [
			{ languages_code: 'es', label: 'Hola', missing: '' },
			{ languages_code: 'fr', label: '', missing: null },
			{ languages_code: 'en', label: 'Hello', missing: '' },
		];

		expect(JSON.stringify(toLocalizedString(rows, 'label'))).toBe('{"en":"Hello","es":"Hola"}');
		expect(toLocalizedStringOrUndef(rows, 'missing')).toBeUndefined();
		expect(toLocalizedStringNullable(rows, 'missing')).toBeNull();
	});

	test('keeps ordered sparse string leaves through localized JSON recursion', () => {
		const rows = [
			{ languages_code: 'es', content: { title: '', nested: { body: 'Cuerpo' } } },
			{ languages_code: 'fr', content: { title: 'Titre', nested: { body: '' } } },
			{ languages_code: 'en', content: { title: 'Title', nested: { body: 'Body' } } },
		];

		expect(JSON.stringify(toLocalizedJSON(rows, 'content'))).toBe(
			'{"title":{"en":"Title","fr":"Titre"},"nested":{"body":{"en":"Body","es":"Cuerpo"}}}',
		);
	});

	test('pins committed generated-content and static byte oracles', () => {
		expect(sha256(readFileSync(join(REPO_ROOT, 'apps/web/src/lib/content/generated.manifest.json')))).toBe(
			'2be732712bb584f88be7c443177cc3667dfa3e578e678a8f69f4c1068db31df6',
		);
		expect(aggregateSha256(join(REPO_ROOT, 'apps/web/src/lib/content'))).toBe(
			'cbf5c8750f6e0e8893353af1b4d85677ed8e4d1224ae9915c45e5057fa4fc403',
		);
		expect(aggregateSha256(join(REPO_ROOT, 'apps/web/static'))).toBe(
			'a8c4c71e0c658c7e6db5db6010e3eec5fc6dc3e6ad11d00fbdcb8ff227e711db',
		);
	});
});
