import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import sharp from 'sharp';
import type { ExportData } from '../export-data';
import fixture from '../../../../packages/shared/fixtures/export-data.json';
import { prepareBuildMedia, MAX_IMAGE_BYTES, type BuildMediaOptions } from './build-media';
import { fixtureMedia, imageBlocks } from './content-media';
import { writeMediaVariants } from './media-variants';
import { createFixtureSource } from './export-pipeline';
import { buildMirroredMediaAssets, run } from '../export-fallbacks';

const dark = 'aaaaaaaa-0000-0000-0000-000000000001';
const light = 'aaaaaaaa-0000-0000-0000-000000000002';
const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });
async function options(fetcher: BuildMediaOptions['fetcher']) {
	const root = await mkdtemp(resolve(tmpdir(), 'cms-images-'));
	roots.push(root);
	return { directusUrl: 'https://cms.yesid.dev', token: 'test-token',
		staticRoot: resolve(root, 'static'), cacheRoot: resolve(root, 'cache'), fetcher };
}
const image = (id: string) => ({ id: 'image', type: 'image', data: {
	file: { fileId: id, url: '', fileURL: '' }, caption: '', withBorder: false, withBackground: false, stretched: false,
} });
const snapshot = (): ExportData => ({ blogBodies: { test: { time: 1, version: '2', blocks: [image(dark)] } } } as ExportData);
const png = () => sharp({ create: { width: 800, height: 600, channels: 3, background: 'red' } }).png().toBuffer();
const transport = (bytes: Uint8Array, filename = 'single.png', siblings: string[] = []): NonNullable<BuildMediaOptions['fetcher']> => (async (input, init) => {
	expect(String(input).startsWith('https://cms.yesid.dev/')).toBe(true);
	expect(init?.redirect).toBe('error');
	expect(init?.headers).toEqual({ Authorization: 'Bearer test-token' });
	const path = new URL(String(input)).pathname;
	if (path === '/files') return Response.json({ data: siblings.map(id => ({ id })) });
	if (path.startsWith('/files/')) return Response.json({ data: { filename_download: filename } });
	return new Response(bytes, { headers: { 'content-type': 'image/png' } });
});

describe('build image publication', () => {
	it('orients JPEG pixels and metadata before selecting widths, including cache reuse', async () => {
		const bytes = await sharp({ create: { width: 800, height: 600, channels: 3, background: 'red' } })
			.withMetadata({ orientation: 6 }).jpeg({ quality: 100 }).toBuffer();
		const opts = await options(async () => new Response(bytes, { headers: { 'content-type': 'image/jpeg' } }));
		const data: ExportData = { projects: [{ image: dark }] as never };
		const first = await prepareBuildMedia(data, opts);
		const entry = Object.values(first.data)[0]!;
		expect([entry.width, entry.height]).toEqual([600, 800]);
		expect(entry.variants.map(row => row.width)).toEqual([240, 600]);
		for (const variant of first.writes.filter(row => row.filePath.endsWith('.webp'))) {
			const meta = await sharp(variant.content).metadata();
			expect(meta.height).toBe(Math.round(meta.width! * 800 / 600));
			expect(meta.orientation).toBeUndefined();
		}
		expect(await prepareBuildMedia({ projects: [{ image: dark }] as never }, opts)).toEqual(first);
	});

	it.each(['jpeg', 'webp', 'gif', 'avif'] as const)('exports supported single-frame %s uploads with responsive metadata', async format => {
		const bytes = await sharp({ create: { width: 700, height: 400, channels: 3, background: 'blue' } }).toFormat(format).toBuffer();
		const opts = await options(async () => new Response(bytes, { headers: { 'content-type': `image/${format}` } }));
		const data: ExportData = { projects: [{ image: dark }] as never };
		const result = await prepareBuildMedia(data, opts);
		expect(Object.values(result.data)[0]?.width).toBe(700);
		expect(Object.values(result.data)[0]?.variants.length).toBeGreaterThan(0);
	});

	it('exports an unmirrored block and hero into production modules and static output', async () => {
		const bytes = await png();
		const opts = await options(transport(bytes));
		const data = { ...structuredClone(fixture.data), mediaAssets: buildMirroredMediaAssets(), mediaVariants: {} } as ExportData;
		data.projects![0]!.image = dark;
		data.blogBodies![Object.keys(data.blogBodies!)[0]!]!.blocks.push(image(dark) as never);
		const source = createFixtureSource(data);
		const outcome = await run({ ...opts, mediaOptions: opts, source: 'live', policy: 'fail', dryRun: false,
			emitDir: resolve(opts.staticRoot, '../content'), contentSource: { ...source, kind: 'live' } });
		expect(outcome).toEqual({ source: 'live', emitted: 21 });
		const module = await readFile(resolve(opts.staticRoot, '../content/media-assets.ts'), 'utf8');
		expect(module).toContain(`/images/cms/${dark}/`);
		const plan = await prepareBuildMedia(snapshot(), opts);
		await writeMediaVariants(plan);
		const path = Object.keys(plan.data)[0]!;
		expect(await readFile(resolve(opts.staticRoot, path.slice(1)))).toEqual(bytes);
		expect(plan.data[path]!.variants.length).toBeGreaterThan(1);
		for (const variant of plan.data[path]!.variants) expect((await sharp(await readFile(resolve(opts.staticRoot, variant.path.slice(1)))).metadata()).format).toBe('webp');
		const again = await prepareBuildMedia(snapshot(), opts);
		expect(again).toEqual(plan);
	});

	it('supports absent images, single images and optional pairs without requiring a light file', async () => {
		const bytes = await png();
		const opts = await options(transport(bytes, 'example.dark.png'));
		expect((await prepareBuildMedia({}, opts)).writes).toEqual([]);
		const single = snapshot();
		await prepareBuildMedia(single, opts);
		expect(imageBlocks(single)[0]!.variants).toBeUndefined();
		const pair = snapshot();
		await prepareBuildMedia(pair, { ...opts, fetcher: transport(bytes, 'example.dark.png', [light]) });
		expect(imageBlocks(pair)[0]!.variants?.light?.fileId).toBe(light);
		expect(Object.keys(pair.mediaAssets!)).toEqual([dark, light]);
		const explicit = snapshot();
		imageBlocks(explicit)[0]!.variants = { light: { fileId: light, fileURL: '', url: '' } };
		await prepareBuildMedia(explicit, opts);
		expect(imageBlocks(explicit)[0]!.variants?.light?.fileId).toBe(light);
	});

	it('uses labelled placeholders without network and preserves committed mirrors', async () => {
		const data = snapshot();
		fixtureMedia(data);
		expect(data.mediaAssets?.[dark]).toBe('/images/cms-fixture-placeholder.png');
		const mirrors = buildMirroredMediaAssets();
		const before = JSON.stringify(mirrors);
		const opts = await options(async () => { throw new Error('network forbidden'); });
		await prepareBuildMedia({ projects: [{ image: Object.keys(mirrors)[0] }] as never, mediaAssets: mirrors }, opts);
		expect(JSON.stringify(buildMirroredMediaAssets())).toBe(before);
	});

	it('emits an unmirrored fixture reference without credentials or network', async () => {
		const opts = await options(async () => { throw new Error('network forbidden'); });
		const data = { ...structuredClone(fixture.data), mediaAssets: buildMirroredMediaAssets(), mediaVariants: {} } as ExportData;
		data.projects![0]!.image = dark;
		expect(await run({ ...opts, token: '', mediaOptions: opts, source: 'fixture', dryRun: false,
			contentSource: createFixtureSource(data), emitDir: resolve(opts.staticRoot, '../content') })).toEqual({ source: 'fixture', emitted: 21 });
		expect(await readFile(resolve(opts.staticRoot, '../content/media-assets.ts'), 'utf8')).toContain('cms-fixture-placeholder.png');
	}, 30_000); // Same budget as the existing full offline export test (includes all pinned variants).

	it.each(['missing', 'corrupt', 'oversized', 'stream-limit', 'wrong-type', 'mime-mismatch', 'dimensions', 'svg'] as const)('fails production without emitting for %s images', async kind => {
		let response: Response;
		if (kind === 'missing') response = new Response('', { status: 404 });
		else if (kind === 'oversized') response = new Response('', { headers: { 'content-length': String(MAX_IMAGE_BYTES + 1), 'content-type': 'image/png' } });
		else if (kind === 'stream-limit') response = new Response(new Uint8Array(MAX_IMAGE_BYTES + 1), { headers: { 'content-type': 'image/png' } });
		else if (kind === 'dimensions') response = new Response(await sharp({ create: { width: 16001, height: 1, channels: 3, background: 'red' } }).png().toBuffer(), { headers: { 'content-type': 'image/png' } });
		else response = new Response(kind === 'corrupt' ? 'bad png' : await png(), { headers: { 'content-type': kind === 'wrong-type' ? 'text/html' : kind === 'svg' ? 'image/svg+xml' : kind === 'mime-mismatch' ? 'image/jpeg' : 'image/png' } });
		const opts = await options(async () => new Response(await response.clone().arrayBuffer(), { status: response.status, headers: response.headers }));
		const data = { ...structuredClone(fixture.data), mediaAssets: buildMirroredMediaAssets(), mediaVariants: {} } as ExportData;
		data.projects![0]!.image = dark;
		const source = createFixtureSource(data);
		expect(await run({ ...opts, mediaOptions: opts, source: 'live', policy: 'fail', dryRun: false,
			emitDir: resolve(opts.staticRoot, '../content'), contentSource: { ...source, kind: 'live' } })).toEqual({ source: 'none', emitted: 0 });
	});
});
