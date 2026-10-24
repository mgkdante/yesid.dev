import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import assetIds from '../../../../packages/shared/fixtures/assets-id-map.json';

const srcRoot = join(import.meta.dirname, '..');

// Existing injection files, reviewed by input provenance. Adding a new file
// requires an explicit review; this list does not depend on source line numbers.
const reviewedSinks = [
	{ file: 'lib/components/brand/SvgIcon.svelte', reason: 'static committed asset' },
	{ file: 'lib/components/cms/blocks/CodeBlock.svelte', reason: 'server Shiki output or escaped plain code' },
	{ file: 'lib/components/cms/blocks/Heading.svelte', reason: 'exported Editor.js inline HTML' },
	{ file: 'lib/components/cms/blocks/ImageBlock.svelte', reason: 'exported Editor.js caption HTML' },
	{ file: 'lib/components/cms/blocks/MermaidDiagram.svelte', reason: 'Mermaid strict mode output' },
	{ file: 'lib/components/cms/blocks/NestedList.svelte', reason: 'exported Editor.js inline HTML' },
	{ file: 'lib/components/cms/blocks/Paragraph.svelte', reason: 'exported Editor.js HTML with inline code formatting' },
	{ file: 'lib/components/cms/blocks/Quote.svelte', reason: 'exported Editor.js inline HTML' },
	{ file: 'lib/components/contact/ContactPage.svelte', reason: 'exported CMS line template with escaped link labels and localized internal links' },
	{ file: 'lib/components/home/CloserGraffiti.svelte', reason: 'static committed asset' },
	{ file: 'lib/components/home/CloserProps.svelte', reason: 'static committed asset and fixed SVG filter markup' },
	{ file: 'lib/components/home/HomeServices.svelte', reason: 'static committed asset' },
	{ file: 'lib/components/projects/ProjectCard.svelte', reason: 'static committed asset' },
	{ file: 'lib/components/projects/ProjectDetailPage.svelte', reason: 'sanitize-html README content and Mermaid strict mode output' },
	{ file: 'lib/components/projects/ProjectImageGallery.svelte', reason: 'exported Editor.js caption HTML' },
	{ file: 'lib/components/seo/JsonLd.svelte', reason: 'JSON-LD serializer escapes < before embedding in a script element' },
	{ file: 'lib/motion/svg/MetroNetwork.svelte', reason: 'static committed asset' },
];

function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		if (entry.name === '.cms-cache.json') return [];
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return entry.name === 'tests' ? [] : sourceFiles(path);
		if (/\.(test|spec)\./.test(entry.name)) return [];
		return /\.(svelte|[cm]?[jt]s|html|css|json|svg)$/.test(entry.name) ? [path] : [];
	});
}

const sources = sourceFiles(srcRoot).map((path) => ({
	file: relative(srcRoot, path).replaceAll('\\', '/'),
	source: readFileSync(path, 'utf8'),
}));

function hasInjectionSink(source: string): boolean {
	const patterns = [
		{ name: 'Svelte raw HTML', pattern: /\{\s*@html\b/ },
		{ name: 'dot property assignment', pattern: /\.\s*(?:innerHTML|outerHTML)\s*(?:\+=|=(?!=))/ },
		{ name: 'bracket property assignment', pattern: /\[\s*(['"`])(?:innerHTML|outerHTML)\1\s*\]\s*(?:\+=|=(?!=))/ },
		{ name: 'adjacent HTML insertion', pattern: /\binsertAdjacentHTML\s*\(/ },
		{ name: 'unsafe HTML methods', pattern: /\.\s*(?:setHTMLUnsafe|parseHTMLUnsafe)\s*\(/ },
		{ name: 'HTML property attribute', pattern: /<[A-Za-z][^>]*\s(?:innerHTML|outerHTML)\s*=(?!=)/i },
		{ name: 'DOM parsing', pattern: /(?:\.\s*parseFromString|\[\s*(['"`])parseFromString\1\s*\])\s*\(/ },
	];
	return patterns.some(({ pattern }) => pattern.test(source));
}

describe('injection detector', () => {
	it.each([
		['{@html value}', true],
		['{ @html value}', true],
		['el.innerHTML = value', true],
		['el.outerHTML += value', true],
		["el['innerHTML'] = value", true],
		['el["outerHTML"] = value', true],
		['el[`innerHTML`] = value', true],
		['el[`outerHTML`] = value', true],
		['el.insertAdjacentHTML("beforeend", value)', true],
		['el.setHTMLUnsafe(value)', true],
		['Document.parseHTMLUnsafe(value)', true],
		['<div innerHTML={value}>', true],
		['<svelte:element this="div" outerHTML={value}>', true],
		['parser.parseFromString(value, "image/svg+xml")', true],
		["parser['parseFromString'](value)", true],
		['parser["parseFromString"](value)', true],
		['parser[`parseFromString`](value)', true],
		['<!-- { @html value} -->', true],
		['const markup = el.innerHTML', false],
		['el.outerHTML === value', false],
		['el.textContent = value', false],
		['<div title="safe">value</div>', false],
	])('detects %s: %s', (source, expected) => {
		expect(hasInjectionSink(source)).toBe(expected);
	});
});

describe('asset boundaries', () => {
	it('keeps literal Directus asset URLs and registered UUIDs out of hand-written source', () => {
		const uuids = Object.values(assetIds);
		const generated = new Set(sources.filter(({ file, source }) =>
			file.startsWith('lib/content/') && source.includes('GENERATED FILE - do not edit by hand.'),
		).map(({ file }) => file));
		const assetUrl = /\/assets\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/i;
		const violations = sources
			.filter(({ file }) => !generated.has(file))
			.filter(({ source }) => assetUrl.test(source) || uuids.some((id) => source.toLowerCase().includes(id)))
			.map(({ file }) => file);
		expect(violations).toEqual([]);
	});

	it('keeps raw HTML and SVG injection inside reviewed files', () => {
		const allowed = new Set(reviewedSinks.map(({ file }) => file));
		const actual = sources.filter(({ source }) => hasInjectionSink(source)).map(({ file }) => file);
		expect(actual.filter((file) => !allowed.has(file))).toEqual([]);
		expect([...actual].sort()).toEqual([...allowed].sort());
	});
});
