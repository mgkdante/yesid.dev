import { expect, it } from 'bun:test';
import type { BlockEditorDoc } from '@repo/shared';
import type { ExportData } from './export-data';
import { buildEmitConfigs } from './lib/emitters/configs';
import { readCache } from './lib/cache';
import { assertTrimmedExportData, FIXTURE_PATH, serializeFixture, trimExportData } from './trim-export-fixture';

it('reads the committed fixture through readCache without derived media and is a fixed point', async () => {
	const fixture = await readCache(FIXTURE_PATH);
	expect(fixture).not.toBeNull();
	if (!fixture) throw new Error('Missing committed export fixture');
	expect(fixture).not.toHaveProperty('mediaAssets');
	expect(fixture).not.toHaveProperty('mediaVariants');
	// The exporter hydrates these derived fields from the asset manifest before emission.
	expect(buildEmitConfigs({ ...fixture, mediaAssets: {}, mediaVariants: {} }, '/fixture')).toHaveLength(20);
	expect(trimExportData(fixture)).toEqual(fixture);
	assertTrimmedExportData(fixture, fixture);
	expect(JSON.parse(serializeFixture(fixture))).toEqual({ version: '1', directusUrl: 'fixture', data: fixture });
});

it('rejects changed identities, missing locales/media, renderer changes and malformed documents', async () => {
	const fixture = (await readCache(FIXTURE_PATH))!;
	const corruptions: ((data: ExportData) => void)[] = [
		(data) => { data.projects![0]!.slug = 'changed-identity'; },
		(data) => { delete data.projects![0]!.title.fr; },
		(data) => { data.projects![0]!.image = '00000000-0000-0000-0000-000000000000'; },
		(data) => { Object.values(data.blogBodies!)[0]!.blocks.push({ id: 'extra', type: 'delimiter', data: {} }); },
		(data) => { Object.values(data.blogBodies!)[0]!.version = 42 as unknown as string; },
		(data) => { delete data.nav; },
		(data) => { data.mediaAssets = {}; },
	];
	for (const corrupt of corruptions) {
		const changed = structuredClone(fixture);
		corrupt(changed);
		expect(() => assertTrimmedExportData(fixture, changed)).toThrow();
	}
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
	const trimmed = trimExportData({ blogBodies: { example: doc } }).blogBodies!.example!;
	expect(trimmed.blocks.map((block) => block.id)).toEqual(['p1', 'h2', 'h3', 'code', 'diagram', 'marked', 'link1', 'link2', 'slot']);
	expect(trimmed.blocks[0]!.data).toEqual({ text: 'Fixture copy.' });
	expect(JSON.stringify(trimmed)).toContain('<strong>Fixture copy.</strong>');
	expect(JSON.stringify(trimmed)).toContain('{count}');
	expect(JSON.stringify(trimmed)).not.toContain('Template prose.');
	expect(JSON.stringify(trimmed)).toContain('```mermaid');
	expect(JSON.stringify(trimmed)).toContain('href=');
	expect(doc.blocks).toHaveLength(10);
});
