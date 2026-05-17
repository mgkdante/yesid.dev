import { describe, expect, it } from 'bun:test';
import { emitValue, emitExport } from './format';
import { emitModule } from './emit-module';

describe('emitValue — primitives', () => {
	it('emits null, undefined (preserves nothing), numbers, booleans', () => {
		expect(emitValue(null)).toBe('null');
		expect(emitValue(undefined)).toBe('undefined');
		expect(emitValue(42)).toBe('42');
		expect(emitValue(3.14)).toBe('3.14');
		expect(emitValue(true)).toBe('true');
		expect(emitValue(false)).toBe('false');
	});

	it('emits strings with single quotes + escapes', () => {
		expect(emitValue('hello')).toBe("'hello'");
		expect(emitValue("it's")).toBe("'it\\'s'");
		expect(emitValue('a\nb')).toBe("'a\\nb'");
		expect(emitValue('back\\slash')).toBe("'back\\\\slash'");
	});
});

describe('emitValue — objects', () => {
	it('emits inline for short LocalizedString objects', () => {
		expect(emitValue({ en: 'Hello' })).toBe("{ en: 'Hello' }");
		expect(emitValue({ en: 'Hi', fr: 'Salut' })).toBe("{ en: 'Hi', fr: 'Salut' }");
	});

	it('sorts object keys alphabetically (idempotency)', () => {
		const out = emitValue({ z: 1, a: 2, m: 3 });
		expect(out).toBe('{ a: 2, m: 3, z: 1 }');
	});

	it('drops undefined-valued keys (matches LocalizedString optional locale convention)', () => {
		const out = emitValue({ en: 'Hi', fr: undefined, es: 'Hola' });
		expect(out).toBe("{ en: 'Hi', es: 'Hola' }");
	});

	it('emits empty object as `{}`', () => {
		expect(emitValue({})).toBe('{}');
	});

	it('switches to multiline when inline form exceeds threshold', () => {
		const longStr = 'x'.repeat(80);
		const out = emitValue({ en: longStr });
		expect(out).toContain('\n');
		expect(out.startsWith('{\n\t')).toBe(true);
	});

	it('handles nested objects with deterministic indentation', () => {
		const out = emitValue({
			outer: { inner: { en: 'Hello, world!', fr: 'Bonjour, monde !' } },
		});
		// Outer goes multiline because inner LS exceeds threshold inline as parent
		expect(out).toContain('outer');
		expect(out).toContain("en: 'Hello, world!'");
	});
});

describe('emitValue — arrays', () => {
	it('emits empty array as `[]`', () => {
		expect(emitValue([])).toBe('[]');
	});

	it('emits short primitive arrays inline', () => {
		expect(emitValue([1, 2, 3])).toBe('[1, 2, 3]');
		expect(emitValue(['a', 'b'])).toBe("['a', 'b']");
	});

	it('emits long primitive arrays multiline', () => {
		const long = Array.from({ length: 20 }, (_, i) => `item-${i}`);
		const out = emitValue(long);
		expect(out).toContain('\n');
		expect(out.startsWith('[\n\t')).toBe(true);
	});

	it('preserves array order (semantic — never sorted)', () => {
		expect(emitValue(['z', 'a', 'm'])).toBe("['z', 'a', 'm']");
	});

	it('emits arrays of objects multiline', () => {
		const out = emitValue([
			{ id: 'a', name: 'Alpha' },
			{ id: 'b', name: 'Bravo' },
		]);
		expect(out).toContain('\n');
		expect(out).toMatch(/id: 'a'/);
		expect(out).toMatch(/id: 'b'/);
		// Object inside array: alphabetic key sort still applies
		expect(out.indexOf('id:')).toBeLessThan(out.indexOf('name:'));
	});
});

describe('emitValue — idempotency', () => {
	it('produces byte-identical output across runs on the same input', () => {
		const fixture = {
			id: 'svc-1',
			title: { en: 'Service', fr: 'Service', es: 'Servicio' },
			stack: ['PostgreSQL', 'Python'],
			sections: [
				{ title: { en: 'Why' }, content: { en: 'Because.' } },
				{ title: { en: 'How' }, content: { en: 'Like so.' } },
			],
		};
		expect(emitValue(fixture)).toBe(emitValue(fixture));
	});
});

describe('emitExport', () => {
	it('wraps value with `export const <name>: <type> = ...;`', () => {
		const out = emitExport('siteMeta', 'SiteMeta', { name: 'yesid.' });
		expect(out).toBe("export const siteMeta: SiteMeta = { name: 'yesid.' };");
	});
});

describe('emitModule', () => {
	it('produces a self-contained module with header + imports + exports', () => {
		const out = emitModule({
			filePath: '/tmp/test.ts',
			description: 'Test fixture.',
			imports: [{ symbols: ['SiteMeta'], from: '$lib/types', typeOnly: true }],
			exports: [{ name: 'siteMeta', typeName: 'SiteMeta', value: { name: 'yesid.' } }],
		});
		expect(out).toContain('// GENERATED FILE');
		expect(out).toContain('// Test fixture.');
		expect(out).toContain("import type { SiteMeta } from '$lib/types';");
		expect(out).toContain('export const siteMeta: SiteMeta');
		expect(out.endsWith('\n')).toBe(true);
		// No double-blank-line between header → import.
		expect(out).not.toContain('\n\n\n');
	});

	it('omits imports block when none provided', () => {
		const out = emitModule({
			filePath: '/tmp/test.ts',
			description: 'Just exports here.',
			imports: [],
			exports: [{ name: 'x', typeName: 'number', value: 1 }],
		});
		// No import statement line (description-text matches "import" don't count)
		expect(out).not.toMatch(/^import /m);
		expect(out).toContain('export const x: number = 1;');
	});

	it('emits multiple exports separated by blank line', () => {
		const out = emitModule({
			filePath: '/tmp/test.ts',
			description: 'Two exports.',
			imports: [],
			exports: [
				{ name: 'a', typeName: 'number', value: 1 },
				{ name: 'b', typeName: 'number', value: 2 },
			],
		});
		expect(out).toContain('export const a: number = 1;\n\nexport const b: number = 2;');
	});

	it('module output is idempotent', () => {
		const cfg = {
			filePath: '/tmp/test.ts',
			description: 'Idempotency check.',
			imports: [{ symbols: ['T'], from: 'x', typeOnly: true }],
			exports: [{ name: 'v', typeName: 'T', value: { foo: 'bar', baz: 42 } }],
		};
		expect(emitModule(cfg)).toBe(emitModule(cfg));
	});
});
