// Inspect emitted documents and image bytes without starting a browser or server.
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test, after } from 'node:test';
import { parseDocument } from 'htmlparser2';

const output = new URL('../.svelte-kit/output/', import.meta.url);
const { create_server } = await import(new URL('server/index.js', output));
const { manifest } = await import(new URL('server/manifest.js', output));
const server = create_server(manifest);
await server.init({ env: {} });
const sitemap = await server.respond(new Request('https://yesid.dev/sitemap.xml'), {
	getClientAddress: () => '127.0.0.1',
});
assert.equal(sitemap.status, 200);
const xml = await sitemap.text();
const unescape = text => text.replaceAll('&amp;', '&');
const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, row]) => ({
	loc: unescape(/<loc>([^<]+)<\/loc>/.exec(row)[1]),
	alternates: [...row.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)]
		.map(([, lang, href]) => [lang, unescape(href)]),
}));
assert.ok(entries.length > 0, 'The sitemap must contain published pages');

function tags(node, name) {
	return [ ...(node.name === name ? [node] : []),
		...(node.children ?? []).flatMap(child => tags(child, name)) ];
}

function text(node) {
	return node?.type === 'text' ? node.data : (node?.children ?? []).map(text).join('');
}

function oneTag(document, name, predicate, label) {
	const matches = tags(document, name).filter(predicate);
	assert.equal(matches.length, 1, `${label}: expected exactly one matching element`);
	return matches[0];
}

function metaContent(document, name, kind = 'name') {
	return oneTag(document, 'meta', node => node.attribs[kind] === name, name).attribs.content;
}

function imageBytes(bytes) {
	if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return true;
	if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return true;
	if (/^GIF8[79]a/.test(bytes.toString('ascii', 0, 6))) return true;
	if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return true;
	if (bytes.toString('ascii', 4, 8) === 'ftyp' && /avif|avis/.test(bytes.toString('ascii', 8, 32))) return true;
	const root = parseDocument(bytes.toString('utf8'), { xmlMode: true }).children.find(node => node.type === 'tag');
	return root?.name.split(':').at(-1) === 'svg';
}

async function shareImageBytes(path, roots) {
	let missing;
	for (const root of roots) {
		const asset = new URL(path.slice(1), root);
		assert.ok(asset.href.startsWith(root.href), 'Share image stays inside the asset root');
		try {
			return await readFile(asset);
		} catch (error) {
			if (error.code !== 'ENOENT') throw error;
			missing = error;
		}
	}
	throw missing;
}

async function documentFor(path) {
	const file = path === '/' ? 'index.html' : `${path.slice(1)}.html`;
	const html = await readFile(new URL(`prerendered/pages/${file}`, output), 'utf8');
	return parseDocument(html);
}

function headContract(document, entry) {
	const head = tags(document, 'head')[0];
	const content = (name, kind = 'name') => metaContent(document, name, kind);
	const title = text(tags(head, 'title')[0]);
	assert.match(title, /\S/);
	assert.ok(title.length <= 70, 'Title fits the share/search limit');
	assert.match(content('description') ?? '', /\S/);
	assert.equal(content('robots'), 'max-image-preview:large');
	assert.equal(oneTag(document, 'link', link => link.attribs.rel === 'canonical', 'canonical').attribs.href, entry.loc);
	const actual = tags(document, 'link').filter(link => link.attribs.rel === 'alternate' && link.attribs.hreflang)
		.map(link => [link.attribs.hreflang, link.attribs.href]);
	if (entry.alternates.length > 1) assert.deepEqual(actual, entry.alternates);
	else assert.ok(actual.every(([, href]) => href === entry.loc));
	const graph = JSON.parse(text(oneTag(document, 'script', node => node.attribs.type === 'application/ld+json', 'JSON-LD')))['@graph'];
	assert.ok(graph.length > 0);
	for (const node of graph) assert.equal(typeof node['@type'], 'string');
	const alt = content('og:image:alt', 'property') ?? '';
	assert.match(alt, /^.+ \| yesid\.$/);
	assert.doesNotMatch(alt, /^yesid\. [|·]/);
	assert.ok(!alt.includes(' | yesid. | yesid.'));
	assert.equal(content('twitter:image:alt'), alt);
}

async function imageContract(document, roots = [new URL('prerendered/pages/', output), new URL('../static/', import.meta.url)]) {
	const content = property => metaContent(document, property, 'property');
	const path = new URL(content('og:image')).pathname;
	const bytes = await shareImageBytes(path, roots);
	assert.ok(imageBytes(bytes), `${path}: not image bytes`);
	if (!path.startsWith('/og/')) return;
	assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], 'OG bytes are PNG');
	assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [
		Number(content('og:image:width')), Number(content('og:image:height')),
	], 'Emitted PNG dimensions match the rendered metadata');
}

for (const entry of entries) {
	const path = new URL(entry.loc).pathname;
	const document = await documentFor(path);
	test(`${path}: document language`, () => {
		const segment = path.split('/')[1];
		assert.equal(tags(document, 'html')[0]?.attribs.lang, ['fr', 'es'].includes(segment) ? segment : 'en');
	});
	test(`${path}: page landmarks`, () => {
		assert.equal(tags(document, 'main').length, 1);
		assert.equal(tags(document, 'main')[0]?.attribs.id, 'main');
		assert.equal(tags(document, 'footer').length, 1);
	});
	test(`${path}: head matches sitemap`, () => headContract(document, entry));
	test(`${path}: share image dimensions`, () => imageContract(document));
}

const fixtureDirectory = await mkdtemp(join(tmpdir(), 'yesid-share-images-'));
const fixtureRoot = pathToFileURL(`${fixtureDirectory}/`);
await writeFile(new URL('cover.png', fixtureRoot), Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64',
));
await writeFile(new URL('broken.png', fixtureRoot), '<html>Not an image</html>');
after(async () => {
	await unlink(new URL('cover.png', fixtureRoot));
	await unlink(new URL('broken.png', fixtureRoot));
	await rmdir(fixtureDirectory);
});
const imageDocument = path => parseDocument(`<head><meta property="og:image" content="https://yesid.dev${path}"></head>`);
test('a valid mirrored share image is accepted', () => imageContract(imageDocument('/cover.png'), [fixtureRoot]));
test('a missing mirrored share image fails', async () => {
	await assert.rejects(imageContract(imageDocument('/missing-image.png'), [fixtureRoot]), { code: 'ENOENT' });
});
test('non-image bytes in a mirrored share image fail', async () => {
	await assert.rejects(imageContract(imageDocument('/broken.png'), [fixtureRoot]), /not image bytes/);
});

const duplicateHeadValues = [
	['canonical', '<link rel="canonical" href="https://yesid.dev/conflicting">'],
	['description', '<meta name="description" content="Conflicting description">'],
	['robots', '<meta name="robots" content="noindex">'],
	['OG image alt', '<meta property="og:image:alt" content="Conflicting image">'],
	['Twitter image alt', '<meta name="twitter:image:alt" content="Conflicting image">'],
	['JSON-LD', '<script type="application/ld+json">{"@graph":[]}</script>'],
	['OG image', '<meta property="og:image" content="https://yesid.dev/missing-image.png">'],
	['OG width', '<meta property="og:image:width" content="13">'],
	['OG height', '<meta property="og:image:height" content="13">'],
];
for (const [name, markup] of duplicateHeadValues) {
	test(`a duplicate ${name} fails the document contract`, async () => {
		const entry = entries.find(row => new URL(row.loc).pathname === '/');
		assert.ok(entry, 'The root fixture document exists');
		const document = await documentFor('/');
		tags(document, 'head')[0].children.push(...parseDocument(markup).children);
		await assert.rejects(async () => {
			headContract(document, entry);
			await imageContract(document);
		}, /exactly one/);
	});
}
test('a conflicting canonical in the body also fails the document contract', async () => {
	const entry = entries.find(row => new URL(row.loc).pathname === '/');
	assert.ok(entry, 'The root fixture document exists');
	const document = await documentFor('/');
	tags(document, 'body')[0].children.push(...parseDocument('<link rel="canonical" href="https://yesid.dev/conflicting">').children);
	assert.throws(() => headContract(document, entry), /exactly one/);
});
