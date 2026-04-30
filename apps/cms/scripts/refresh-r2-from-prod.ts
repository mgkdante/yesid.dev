#!/usr/bin/env bun
/**
 * Refresh dev R2 bucket from prod R2 bucket.
 *
 * Used as part of the full "refresh dev from prod" cycle (Neon branch reset
 * + R2 sync + git develop reset). Run alone when dev's R2 needs re-mirror
 * without touching DB/code.
 *
 * Strategy: empty dev bucket, then copy every object from prod via R2's
 * S3-compatible CopyObject (server-side; no bandwidth round-trip).
 *
 * Usage:
 *   op run --env-file=apps/cms/.env -- bun --cwd apps/cms run refresh:r2
 *   # or directly with R2_* env vars set:
 *   R2_ACCESS_KEY=... R2_SECRET_KEY=... R2_ENDPOINT=https://...r2.cloudflarestorage.com \
 *     bun apps/cms/scripts/refresh-r2-from-prod.ts
 *
 * Required env:
 *   R2_ACCESS_KEY    — R2 access key ID (account-wide token)
 *   R2_SECRET_KEY    — R2 secret access key
 *   R2_ENDPOINT      — https://<account-id>.r2.cloudflarestorage.com
 *   R2_PROD_BUCKET   — defaults to 'yesid-dev-cms'
 *   R2_DEV_BUCKET    — defaults to 'yesid-dev-cms-dev'
 *
 * Safety: refuses to run if PROD_BUCKET === DEV_BUCKET (would empty + repopulate
 * the same bucket, no-op but confusing).
 */

import {
	S3Client,
	ListObjectsV2Command,
	CopyObjectCommand,
	DeleteObjectsCommand,
	type _Object,
	type ObjectIdentifier,
} from '@aws-sdk/client-s3';

const PROD_BUCKET = process.env.R2_PROD_BUCKET ?? 'yesid-dev-cms';
const DEV_BUCKET = process.env.R2_DEV_BUCKET ?? 'yesid-dev-cms-dev';
const ENDPOINT = process.env.R2_ENDPOINT;
const ACCESS_KEY = process.env.R2_ACCESS_KEY ?? process.env.STORAGE_S3_KEY;
const SECRET_KEY = process.env.R2_SECRET_KEY ?? process.env.STORAGE_S3_SECRET;

if (PROD_BUCKET === DEV_BUCKET) {
	console.error(`Refusing to run: PROD_BUCKET (${PROD_BUCKET}) === DEV_BUCKET (${DEV_BUCKET}).`);
	console.error('Configure separate buckets via R2_PROD_BUCKET and R2_DEV_BUCKET.');
	process.exit(1);
}
if (!ENDPOINT || !ACCESS_KEY || !SECRET_KEY) {
	console.error('Missing required env: R2_ENDPOINT, R2_ACCESS_KEY (or STORAGE_S3_KEY), R2_SECRET_KEY (or STORAGE_S3_SECRET).');
	process.exit(1);
}

const client = new S3Client({
	region: 'auto',
	endpoint: ENDPOINT,
	credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
	forcePathStyle: true,
});

async function listAll(bucket: string): Promise<_Object[]> {
	const all: _Object[] = [];
	let token: string | undefined = undefined;
	do {
		const res = await client.send(
			new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token, MaxKeys: 1000 }),
		);
		if (res.Contents) all.push(...res.Contents);
		token = res.IsTruncated ? res.NextContinuationToken : undefined;
	} while (token);
	return all;
}

async function emptyBucket(bucket: string): Promise<number> {
	const objects = await listAll(bucket);
	if (objects.length === 0) return 0;
	// DeleteObjects max 1000 at a time
	let deleted = 0;
	for (let i = 0; i < objects.length; i += 1000) {
		const batch = objects.slice(i, i + 1000);
		const ids: ObjectIdentifier[] = batch
			.filter((o): o is _Object & { Key: string } => typeof o.Key === 'string')
			.map((o) => ({ Key: o.Key }));
		await client.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: ids, Quiet: true } }));
		deleted += ids.length;
	}
	return deleted;
}

async function copyAll(source: string, dest: string): Promise<number> {
	const objects = await listAll(source);
	let copied = 0;
	for (const obj of objects) {
		if (!obj.Key) continue;
		await client.send(
			new CopyObjectCommand({
				Bucket: dest,
				Key: obj.Key,
				CopySource: encodeURIComponent(`${source}/${obj.Key}`),
			}),
		);
		copied++;
		if (copied % 25 === 0) {
			console.log(`  copied ${copied}/${objects.length}...`);
		}
	}
	return copied;
}

async function main(): Promise<void> {
	console.log(`R2 refresh: ${PROD_BUCKET} (read-only) → ${DEV_BUCKET}`);
	console.log(`Endpoint: ${ENDPOINT}`);
	console.log('');

	console.log(`[1/2] Emptying ${DEV_BUCKET}...`);
	const deleted = await emptyBucket(DEV_BUCKET);
	console.log(`      ${deleted} object(s) deleted.`);

	console.log('');
	console.log(`[2/2] Copying ${PROD_BUCKET} → ${DEV_BUCKET}...`);
	const copied = await copyAll(PROD_BUCKET, DEV_BUCKET);
	console.log(`      ${copied} object(s) copied.`);

	console.log('');
	console.log(`Done. Dev R2 bucket now mirrors prod R2 state at ${new Date().toISOString()}.`);
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('FAILED:', err instanceof Error ? err.message : err);
		process.exit(1);
	});
}
