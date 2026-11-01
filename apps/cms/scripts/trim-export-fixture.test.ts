import { expect, it } from 'bun:test';
import type { BlockEditorDoc } from '@repo/shared';
import type { ExportData } from './export-data';
import { buildEmitConfigs } from './lib/emitters/configs';
import { readCache } from './lib/cache';
import { assertTrimmedExportData, FIXTURE_PATH, serializeFixture, trimExportData } from './trim-export-fixture';

const textOf = (block: BlockEditorDoc['blocks'][number] | undefined) => (block && 'text' in block.data ? block.data.text : undefined);

it('reads the committed fixture through readCache without derived media and is a fixed point', async () => {
	const fixture = await readCache(FIXTURE_PATH);
	expect(fixture).not.toBeNull();
	if (!fixture) throw new Error('Missing committed export fixture');
	expect(fixture).not.toHaveProperty('mediaAssets');
	expect(fixture).not.toHaveProperty('mediaVariants');
	// The exporter hydrates these derived fields from the asset manifest before emission.
	expect(buildEmitConfigs({ ...fixture, mediaAssets: {}, mediaVariants: {} }, '/fixture')).toHaveLength(21);
	expect(trimExportData(fixture)).toEqual(fixture);
	assertTrimmedExportData(fixture, fixture);
	expect(JSON.parse(serializeFixture(fixture))).toEqual({ version: '1', directusUrl: 'fixture', data: fixture });
	expect(serializeFixture(fixture)).toBe(await Bun.file(FIXTURE_PATH).text());
});

it('never writes the owner phone into the fixture', async () => {
	const fixture = await readCache(FIXTURE_PATH);
	if (!fixture?.siteMeta) throw new Error('Missing committed export fixture');
	const source = { ...fixture, siteMeta: { ...fixture.siteMeta, owner: { ...fixture.siteMeta.owner, phone: '+12025550100' } } };
	const trimmed = trimExportData(source);
	expect(trimmed.siteMeta!.owner).not.toHaveProperty('phone');
	assertTrimmedExportData(source, trimmed);
});

it('keeps bounded SEO, error headings and email-bearing paragraphs verbatim', () => {
	const description = { en: 'Search description kept verbatim.', fr: 'Description conservée.' };
	const source = {
		routeSeo: [{ description }], siteSeoDefaults: { defaultDescription: description },
		services: [{ seoDescription: description }], blogPosts: [{ seoDescription: description.en }],
		errorPageFallback: { heading: { en: 'Missing page' } },
		errorPages: { 500: { heading: { en: 'Server error' } } },
		legalPages: [{ body: { en: { time: 1, version: '2.31.2', blocks: [
			{ id: 'first', type: 'paragraph', data: { text: 'Prose to trim.' } },
			{ id: 'email', type: 'paragraph', data: { text: 'Please contact contact@yesid.dev for help.' } },
		] } } }],
	} as unknown as ExportData;
	const trimmed = trimExportData(source);
	for (const key of ['routeSeo', 'siteSeoDefaults', 'services', 'blogPosts', 'errorPageFallback', 'errorPages'] as const) {
		expect(trimmed[key]).toEqual(source[key]);
	}
	expect(trimmed.legalPages![0]!.body.en!.blocks[1]).toEqual(source.legalPages![0]!.body.en!.blocks[1]);
});

it('serializes primitive locale objects on one line and leaves nested objects pretty', () => {
	const data = { locales: { en: 'escaped "value"', es: false, fr: null }, nested: { en: { text: 'Prose' } } } as unknown as ExportData;
	const serialized = serializeFixture(data);
	expect(serialized).toContain('"locales": {"en":"escaped \\"value\\"","es":false,"fr":null}');
	expect(serialized).toContain('"nested": {\n');
	expect(serializeFixture(JSON.parse(serialized).data)).toBe(serialized);
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
		(data) => { data.cta!.heading.en = data.cta!.heading.en.replaceAll('\n', ' '); },
		(data) => { data.cta!.subtitle.en = 'Changed short copy'; },
		(data) => { data.legalPages![0]!.body.en!.blocks.splice(1, 1); },
		(data) => {
			const doc = Object.values(data.blogBodies!).find(doc => doc.blocks.filter(block => block.type === 'header').length > 1)!;
			doc.blocks.splice(doc.blocks.findIndex(block => block.type === 'header'), 1);
		},
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
		{ id: 'h2-again', type: 'header', data: { text: 'Another section', level: 2 } },
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
	expect(trimmed.blocks.map((block) => block.id)).toEqual(['p1', 'h2', 'h2-again', 'h3', 'code', 'diagram', 'marked', 'link1', 'link2', 'slot']);
	expect(textOf(trimmed.blocks[0])).toMatch(/^Fixture copy \(en, text, [0-9a-f]{8}\)\.$/);
	expect(JSON.stringify(trimmed)).toMatch(/<strong>Fixture copy \(en, text, [0-9a-f]{8}\)\.<\/strong>/);
	expect(JSON.stringify(trimmed)).toContain('{count}');
	expect(JSON.stringify(trimmed)).not.toContain('Template prose.');
	expect(JSON.stringify(trimmed)).toContain('```mermaid');
	expect(JSON.stringify(trimmed)).toContain('href=');
	expect(doc.blocks).toHaveLength(11);
});

it('keeps every short string verbatim, including the 200-character boundary in every field', () => {
	const short = '\n<strong>{name}</strong>'.padStart(200, 'x');
	const values = { title: 'x'.repeat(200), heading: { en: short, fr: 'Titre court' },
		text: '<strong>Short copy</strong>\n{count}', arbitraryField: 'Unchanged',
		siteLabels: { helper: { en: short, es: 'Texto breve' } } };
	expect<unknown>(trimExportData(values as unknown as ExportData)).toEqual(values);
});

it('gives different long source strings distinct stable placeholders for the same locale and field', () => {
	const source = { legalPages: [{ body: { en: { time: 1, version: '2.31.2', blocks: [
		{ id: 'one', type: 'paragraph', data: { text: 'a'.repeat(201) } },
		{ id: 'two', type: 'paragraph', data: { text: 'b'.repeat(201) } },
	] } } }] } as unknown as ExportData;
	const trimmed = trimExportData(source);
	const [first, second] = trimmed.legalPages![0]!.body.en!.blocks.map(textOf);
	expect(first).toMatch(/^Fixture copy \(en, text, [0-9a-f]{8}\)\.$/);
	expect(second).toMatch(/^Fixture copy \(en, text, [0-9a-f]{8}\)\.$/);
	expect(second).not.toBe(first);
	expect(trimExportData(source)).toEqual(trimmed);
	expect(trimExportData(trimmed)).toEqual(trimmed);
});

it('preserves line breaks, every legal paragraph and distinct locale/field placeholders', () => {
	const paragraphs: BlockEditorDoc = { time: 1, version: '2.31.2', blocks: [
		{ id: 'one', type: 'paragraph', data: { text: 'First paragraph.' } },
		{ id: 'two', type: 'paragraph', data: { text: 'Second paragraph.\nAnother line.' } },
	] };
	const long = 'Prose. '.repeat(40);
	const source = { cta: { heading: { en: `${long}\nSecond`, fr: `${long}\nSecond` }, subtitle: { en: `${long}\nSecond` } },
		siteLabels: { ui: { languageNames: { en: { en: 'English', fr: 'Anglais' }, fr: { en: 'French', fr: 'Français' } } } },
		legalPages: [{ body: { en: paragraphs } }] } as unknown as ExportData;
	const trimmed = trimExportData(source);
	expect(trimmed.cta!.heading.en.split('\n')).toHaveLength(2);
	expect(trimmed.cta!.heading.en).toMatch(/^Fixture copy \(en, heading, [0-9a-f]{8}\)\.\n/);
	expect(trimmed.cta!.heading.fr).not.toBe(trimmed.cta!.heading.en);
	expect(trimmed.cta!.subtitle.en).not.toBe(trimmed.cta!.heading.en);
	expect(trimmed.legalPages![0]!.body.en!.blocks.map(block => block.id)).toEqual(['one', 'two']);
	expect(JSON.stringify(trimmed.legalPages)).toContain('\\n');
	expect(trimmed.siteLabels!.ui.languageNames.en.fr).not.toBe(trimmed.siteLabels!.ui.languageNames.fr.fr);
});
