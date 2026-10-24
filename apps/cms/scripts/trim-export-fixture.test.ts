import { expect, it } from 'bun:test';
import { BlockEditorDocSchema, type BlockEditorDoc } from '@repo/shared';
import { buildEmitConfigs } from './lib/emitters/configs';
import { committedExportData, serializeFixture, trimExportData } from './trim-export-fixture';

it('retains domain identities, locales, media references and all 22 emitters', () => {
	const original = committedExportData();
	const trimmed = trimExportData(original);
	const identities = (value: unknown): unknown => {
		if (Array.isArray(value)) return value.map(identities);
		if (!value || typeof value !== 'object') return undefined;
		return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'blocks').map(([key, entry]) => [
			key, /^(id|slug|translationKey|lang|path|href|url|relatedProjects|relatedServices|stack|tags)$/.test(key)
				? entry : identities(entry),
		]));
	};
	expect(identities(trimmed)).toEqual(identities(original));
	const uuids = (value: unknown) => [...new Set(JSON.stringify(value).match(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/gi))].sort();
	expect(uuids(trimmed)).toEqual(uuids(original));
	expect(buildEmitConfigs(trimmed, '/fixture').length).toBe(22);
	const validateDocs = (value: unknown) => {
		if (!value || typeof value !== 'object') return;
		if ('blocks' in value) BlockEditorDocSchema.parse(value);
		Object.values(value).forEach(validateDocs);
	};
	validateDocs(trimmed);
	expect(trimExportData(trimmed)).toEqual(trimmed);
	expect(JSON.parse(serializeFixture(trimmed))).toEqual({ version: '1', directusUrl: 'fixture', data: trimmed });
});

it('deduplicates prose while retaining header levels, code fences, markup and references', () => {
	const doc: BlockEditorDoc = { time: 1, version: '2.31.2', blocks: [
		{ id: 'p1', type: 'paragraph', data: { text: 'Long prose. '.repeat(30) } },
		{ id: 'p2', type: 'paragraph', data: { text: 'Repeated prose. '.repeat(30) } },
		{ id: 'h2', type: 'header', data: { text: 'Section', level: 2 } },
		{ id: 'h3', type: 'header', data: { text: 'Subsection', level: 3 } },
		{ id: 'code', type: 'code', data: { code: '```ts\nconst value = 1;\n```' } },
		{ id: 'diagram', type: 'code', data: { code: '```mermaid\ngraph LR; A-->B\n```' } },
		{ id: 'marked', type: 'paragraph', data: { text: `<strong>${'Rich prose. '.repeat(30)}</strong>` } },
		{ id: 'link1', type: 'paragraph', data: { text: '<a href="/contact">Contact</a>' } },
		{ id: 'link2', type: 'paragraph', data: { text: '<a href="/about">About</a>' } },
		{ id: 'slot', type: 'paragraph', data: { text: `${'Template prose. '.repeat(30)} {count}` } },
	] };
	// A later paragraph with a template slot is reference-bearing too.
	const trimmed = trimExportData({ blogBodies: { example: doc } }).blogBodies!.example;
	expect(trimmed.blocks.map((block) => block.id)).toEqual(['p1', 'h2', 'h3', 'code', 'diagram', 'marked', 'link1', 'link2', 'slot']);
	expect(trimmed.blocks[0].data).toEqual({ text: 'Fixture copy.' });
	expect(JSON.stringify(trimmed)).toContain('<strong>Fixture copy.</strong>');
	expect(JSON.stringify(trimmed)).toContain('{count}');
	expect(doc.blocks).toHaveLength(10);
});
