/** CMS originals are read on every live build; only verified encodings are cached. */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import type { ExportData } from '../export-data';
import { FILE_ID, imageBlocks, referencedMedia } from './content-media';
import { prepareMediaVariants, writeMediaVariants, type PreparedMediaVariants } from './media-variants';
import { createVariantReceipt, type VariantReceipt } from './variant-receipt';

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const MIME_FORMATS: Record<string, string> = {
	'image/png': 'png', 'image/jpeg': 'jpeg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'heif',
};
export interface BuildMediaOptions {
	directusUrl: string;
	token: string;
	staticRoot: string;
	cacheRoot: string;
	fetcher?: (url: string, init: RequestInit) => Promise<Response>;
}

async function boundedBytes(response: Response): Promise<Buffer> {
	if (Number(response.headers.get('content-length')) > MAX_IMAGE_BYTES) throw new Error('CMS image exceeds 20 MiB');
	if (!response.body) throw new Error('CMS image has no body');
	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.length;
			if (size > MAX_IMAGE_BYTES) throw new Error('CMS image exceeds 20 MiB');
			chunks.push(value);
		}
	} finally { await reader.cancel(); }
	return Buffer.concat(chunks);
}

function cmsReader(options: BuildMediaOptions) {
	const url = new URL(options.directusUrl);
	if (url.origin !== 'https://cms.yesid.dev' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
		throw new Error('Build images require the pinned CMS origin');
	}
	return async (path: string) => {
		const response = await (options.fetcher ?? fetch)(`${url.origin}${path}`, {
			headers: { Authorization: `Bearer ${options.token}` }, redirect: 'error', signal: AbortSignal.timeout(20_000),
		});
		if (!response.ok) throw new Error(`CMS image read failed (${response.status})`);
		return response;
	};
}

/** Native image tool has no light selector. A unique optional filename sibling supplies it. */
async function pairImages(data: ExportData, read: ReturnType<typeof cmsReader>): Promise<void> {
	const names = new Map<string, string>();
	const pairs = new Map<string, string | undefined>();
	for (const block of imageBlocks(data)) {
		const id = block.file.fileId;
		if (!id || block.variants?.light || data.mediaAssets?.[id]) continue;
		if (!FILE_ID.test(id)) throw new Error('Invalid CMS image UUID');
		if (!names.has(id)) {
			const result = z.object({ data: z.object({ filename_download: z.string() }) })
				.parse(await (await read(`/files/${id}?fields=filename_download`)).json());
			names.set(id, result.data.filename_download);
		}
		const filename = names.get(id)!;
		if (!filename.includes('.dark.')) continue;
		if (!pairs.has(filename)) {
			const query = new URLSearchParams({ 'filter[filename_download][_eq]': filename.replace('.dark.', '.light.'), fields: 'id', limit: '2' });
			const result = z.object({ data: z.array(z.object({ id: z.string() })) })
				.parse(await (await read(`/files?${query}`)).json());
			if (result.data.length > 1) throw new Error(`Ambiguous light image filename for ${filename}`);
			const light = result.data[0]?.id;
			if (light && !FILE_ID.test(light)) throw new Error('Invalid CMS light image UUID');
			pairs.set(filename, light);
		}
		const light = pairs.get(filename);
		if (light) block.variants = { light: { fileId: light, fileURL: '', url: '' } };
	}
}

async function encode(bytes: Buffer, hash: string, extension: string, options: BuildMediaOptions) {
	const root = resolve(options.cacheRoot, hash);
	const legacyPath = `images/${hash}.${extension}`;
	const source = resolve(root, legacyPath);
	await mkdir(dirname(source), { recursive: true });
	await writeFile(source, bytes);
	let receipt: VariantReceipt | undefined;
	try { receipt = JSON.parse(await readFile(resolve(root, 'receipt.json'), 'utf8')); }
	catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error; }
	const manifest = { sourceRoot: '.', assets: [{ legacyPath }] };
	const prepared = await prepareMediaVariants(manifest, root, { receipt });
	await writeMediaVariants(prepared);
	await writeFile(resolve(root, 'receipt.json'), JSON.stringify(await createVariantReceipt(manifest, prepared, root)));
	return { root, legacyPath, entry: prepared.data[`/${legacyPath}`]! };
}

async function prepareImage(id: string, read: ReturnType<typeof cmsReader>, options: BuildMediaOptions) {
	const response = await read(`/assets/${id}`);
	const mime = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? '';
	if (!MIME_FORMATS[mime]) throw new Error(`Unsupported CMS image type: ${mime}; SVG requires a reviewed mirror`);
	const bytes = await boundedBytes(response);
	const { default: sharp } = await import('sharp');
	const decoder = sharp(bytes, { limitInputPixels: MAX_PIXELS, failOn: 'warning' }).autoOrient();
	const meta = await decoder.metadata();
	const { width, height } = meta.autoOrient;
	if (meta.format !== MIME_FORMATS[mime] || !width || !height || width > 16000 || height > 16000 || width * height > MAX_PIXELS || (meta.pages ?? 1) > 1) {
		throw new Error('CMS image has invalid format, dimensions or multiple frames');
	}
	// Metadata alone does not prove that the entire compressed image decodes.
	await decoder.stats();
	const hash = createHash('sha256').update(bytes).digest('hex');
	const extension = mime === 'image/jpeg' ? 'jpg' : mime.slice(6);
	const cached = await encode(bytes, hash, extension, options);
	const path = `/images/cms/${id}/${hash}.${extension}`;
	const writes: Array<PreparedMediaVariants['writes'][number]> = [{ filePath: resolve(options.staticRoot, path.slice(1)), content: bytes }];
	const variants = [];
	for (const variant of cached.entry.variants) {
		const output = variant.path.replace('/images/', `/images/cms/${id}/`);
		if (variant.path !== `/${cached.legacyPath}`) writes.push({ filePath: resolve(options.staticRoot, output.slice(1)), content: await readFile(resolve(cached.root, variant.path.slice(1))) });
		variants.push({ ...variant, path: output });
	}
	return { path, entry: { ...cached.entry, variants }, writes };
}

/** Return a plan; caller commits static files only after all content validates. */
export async function prepareBuildMedia(data: ExportData, options: BuildMediaOptions): Promise<PreparedMediaVariants> {
	if (referencedMedia(data).every(id => data.mediaAssets?.[id])) return { data: data.mediaVariants ?? {}, writes: [] };
	const read = cmsReader(options);
	await pairImages(data, read);
	const assets = { ...data.mediaAssets };
	const variants = { ...data.mediaVariants };
	const writes: Array<PreparedMediaVariants['writes'][number]> = [];
	for (const id of referencedMedia(data)) {
		if (assets[id]) continue;
		const image = await prepareImage(id, read, options);
		assets[id] = image.path;
		variants[image.path] = image.entry;
		writes.push(...image.writes);
	}
	data.mediaAssets = assets;
	data.mediaVariants = variants;
	return { data: variants, writes };
}
