#!/usr/bin/env bun
/**
 * export-logos.ts
 *
 * Batch-exports every SVG under brand/logos/ to PNG at 1x / 2x / 3x scales.
 * Output: brand/logos/exports/<name>@{1x,2x,3x}.png
 *
 * Run: `bun run brand:export-logos`
 *
 * Idempotent: re-running overwrites existing exports. Output directory is
 * created if missing. SVGs without a viewBox are rendered at their natural
 * dimensions; with a viewBox, the intrinsic width declared in the SVG
 * determines the 1x size.
 *
 * Font rendering caveat: Sharp uses the system font stack (via librsvg) for
 * SVG text. The brand logos declare Inter (700) and JetBrains Mono. If those
 * fonts aren't installed system-wide on the machine running this script, the
 * rendered PNGs will fall back to the default sans/mono. For canonical
 * exports, install Inter Variable + JetBrains Mono Variable locally before
 * running, or use a CI box that has them. The SVGs themselves remain the
 * authoritative source.
 */

import { readdir, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import sharp from 'sharp';

const SOURCE_DIR = 'brand/logos';
const OUTPUT_DIR = 'brand/logos/exports';
const SCALES = [1, 2, 3] as const;

async function listSvgs(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	return entries
		.filter((e) => e.isFile() && extname(e.name).toLowerCase() === '.svg')
		.map((e) => join(dir, e.name));
}

async function exportOne(svgPath: string): Promise<void> {
	const name = basename(svgPath, '.svg');
	const svg = await Bun.file(svgPath).arrayBuffer();

	// Read SVG metadata to get intrinsic size (width attr or viewBox)
	const meta = await sharp(Buffer.from(svg)).metadata();
	const width = meta.width ?? 320;

	for (const scale of SCALES) {
		const outPath = join(OUTPUT_DIR, `${name}@${scale}x.png`);
		await sharp(Buffer.from(svg), { density: 96 * scale })
			.resize({ width: width * scale })
			.png({ compressionLevel: 9 })
			.toFile(outPath);
		console.log(`  ✓ ${outPath} (${width * scale}px)`);
	}
}

async function main(): Promise<void> {
	await mkdir(OUTPUT_DIR, { recursive: true });
	const svgs = await listSvgs(SOURCE_DIR);

	if (svgs.length === 0) {
		console.error(`No SVGs found under ${SOURCE_DIR}/`);
		process.exit(1);
	}

	console.log(`Exporting ${svgs.length} logo(s) × ${SCALES.length} scales → ${OUTPUT_DIR}/`);
	console.log('');

	for (const svg of svgs) {
		console.log(basename(svg));
		await exportOne(svg);
	}

	console.log('');
	console.log(`Done. ${svgs.length * SCALES.length} PNGs written.`);
}

main().catch((err) => {
	console.error('export-logos failed:', err);
	process.exit(1);
});
