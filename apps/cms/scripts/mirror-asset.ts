import { createHash, randomUUID } from 'node:crypto';
import { readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { getAdminToken } from './lib/auth';
import { defaultDirectusUrl } from './lib/sdk';
import manifest from '../fixtures/assets-manifest.json';
import idMap from '../fixtures/assets-id-map.json';

interface MirrorOptions {
	directusUrl: string;
	token: string;
	repoRoot: string;
	sourceRoot: string;
	legacyPath: string;
	assets: readonly { legacyPath: string }[];
	idMap: Readonly<Record<string, string>>;
	applySha256?: string;
}
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const within = (root: string, path: string) => { const child = relative(root, path); return child !== '..' && !child.startsWith('..\\') && !child.startsWith('../') && !isAbsolute(child); };
function cmsOrigin(value: string) {
	const origin = new URL(value);
	if (origin.origin !== 'https://cms.yesid.dev' || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) throw new Error('Expected an existing HTTPS CMS origin.');
	return origin.origin;
}

/** Read one registered CMS image; preview by default, replace local bytes only by reviewed hash. */
export async function mirrorAsset(options: MirrorOptions, fetcher: (url: string, init: RequestInit) => Promise<Response> = fetch) {
	const origin = cmsOrigin(options.directusUrl);
	const id = options.idMap[options.legacyPath];
	if (!options.assets.some(asset => asset.legacyPath === options.legacyPath) || !id || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) throw new Error('Asset must be registered in the manifest and UUID map before mirroring.');
	const root = await realpath(resolve(options.repoRoot, options.sourceRoot));
	const target = resolve(root, options.legacyPath);
	if (!within(root, target)) throw new Error('Mirror path escapes the static root.');
	if (!within(root, await realpath(dirname(target)))) throw new Error('Mirror directory escapes the static root.');
	let before: Buffer | null = null;
	try { if (!within(root, await realpath(target))) throw new Error('Mirror file escapes the static root.'); before = await readFile(target); }
	catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
	const response = await fetcher(`${origin}/assets/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${options.token}` }, redirect: 'error', signal: AbortSignal.timeout(20_000) });
	if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`CMS image read failed (${response.status}); local mirror retained.`);
	const bytes = Buffer.from(await response.arrayBuffer());
	const { default: sharp } = await import('sharp');
	const metadata = await sharp(bytes).metadata();
	if (!metadata.width || !metadata.height) throw new Error('CMS image has no valid dimensions.');
	const formats: Record<string, string> = { '.svg': 'svg', '.png': 'png', '.jpg': 'jpeg', '.jpeg': 'jpeg', '.webp': 'webp', '.avif': 'heif', '.gif': 'gif' };
	if (metadata.format !== formats[extname(target).toLowerCase()]) throw new Error('CMS image format does not match the registered mirror suffix.');
	const afterSha256 = sha256(bytes);
	if (options.applySha256 && options.applySha256 !== afterSha256) throw new Error('CMS bytes changed from the reviewed hash; preview again.');
	const changed = before === null || sha256(before) !== afterSha256;
	const applied = changed && Boolean(options.applySha256);
	if (applied) {
		const temporary = `${target}.mirror-${randomUUID()}`;
		let owned = false;
		try { await writeFile(temporary, bytes, { flag: 'wx' }); owned = true; await rename(temporary, target); }
		finally { if (owned) await rm(temporary, { force: true }); }
	}
	return { legacyPath: options.legacyPath, fileId: id, beforeSha256: before && sha256(before), afterSha256, bytes: bytes.length, changed, applied };
}

if (import.meta.main) {
	const { values } = parseArgs({ options: { path: { type: 'string' }, 'apply-sha256': { type: 'string' } }, strict: true });
	if (!values.path) throw new Error('Use --path=<registered legacyPath>; preview first, then --apply-sha256=<reviewed digest>. No CMS writes or deletes.');
	const directusUrl = cmsOrigin(defaultDirectusUrl());
	const token = await getAdminToken(directusUrl, { allowBuildToken: false });
	console.log(JSON.stringify(await mirrorAsset({ directusUrl, token, repoRoot: fileURLToPath(new URL('../../..', import.meta.url)), sourceRoot: manifest.sourceRoot, legacyPath: values.path, assets: manifest.assets, idMap, applySha256: values['apply-sha256'] }), null, 2));
}
