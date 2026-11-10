/** Explicitly refresh committed responsive images and their integrity receipt. No CMS access. */
import { resolve } from 'node:path';
import manifest from '../fixtures/assets-manifest.json';
import { buildMirroredMediaAssets } from './export-fallbacks';
import { prepareMediaVariants, writeMediaVariants } from './lib/media-variants';
import { createVariantReceipt } from './lib/variant-receipt';

const repoRoot = resolve(import.meta.dir, '../../..');
buildMirroredMediaAssets();
const prepared = await prepareMediaVariants(manifest, repoRoot, { reuse: false });
await writeMediaVariants(prepared);
const receipt = await createVariantReceipt(manifest, prepared, repoRoot);
await Bun.write(resolve(repoRoot, 'apps/cms/fixtures/media-variants-receipt.json'), JSON.stringify(receipt, null, '\t') + '\n');
