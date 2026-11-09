// Inspect emitted documents and image bytes without starting a browser or server.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
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

async function documentFor(path) {
	const file = path === '/' ? 'index.html' : `${path.slice(1)}.html`;
	const html = await readFile(new URL(`prerendered/pages/${file}`, output), 'utf8');
	return parseDocument(html);
}

function headContract(document, entry) {
	const head = tags(document, 'head')[0];
	const content = (name, kind = 'name') => tags(head, 'meta').find(node => node.attribs[kind] === name)?.attribs.content;
	const title = text(tags(head, 'title')[0]);
	assert.match(title, /\S/);
	assert.ok(title.length <= 70, 'Title fits the share/search limit');
	assert.match(content('description') ?? '', /\S/);
	assert.equal(content('robots'), 'max-image-preview:large');
	assert.equal(tags(head, 'link').find(link => link.attribs.rel === 'canonical')?.attribs.href, entry.loc);
	const actual = tags(head, 'link').filter(link => link.attribs.rel === 'alternate' && link.attribs.hreflang)
		.map(link => [link.attribs.hreflang, link.attribs.href]);
	if (entry.alternates.length > 1) assert.deepEqual(actual, entry.alternates);
	else assert.ok(actual.every(([, href]) => href === entry.loc));
	const graph = JSON.parse(text(tags(head, 'script').find(node => node.attribs.type === 'application/ld+json')))['@graph'];
	assert.ok(graph.length > 0);
	for (const node of graph) assert.equal(typeof node['@type'], 'string');
	const alt = content('og:image:alt', 'property') ?? '';
	assert.match(alt, /^.+ \| yesid\.$/);
	assert.doesNotMatch(alt, /^yesid\. [|·]/);
	assert.ok(!alt.includes(' | yesid. | yesid.'));
	assert.equal(content('twitter:image:alt'), alt);
}

async function imageContract(document) {
	const content = property => tags(tags(document, 'head')[0], 'meta').find(node => node.attribs.property === property)?.attribs.content;
	const path = new URL(content('og:image')).pathname;
	if (!path.startsWith('/og/')) return;
	let bytes;
	try {
		bytes = await readFile(new URL(`prerendered/pages${path}`, output));
	} catch (error) {
		if (error.code !== 'ENOENT') throw error;
		bytes = await readFile(new URL(`../static${path}`, import.meta.url));
	}
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
