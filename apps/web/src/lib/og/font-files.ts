// resvg-js needs font file paths, but Vite bundles the route away from the package's
// font folder. Write the fonts Vite inlined to a temp folder, once per process.

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ogFonts } from '@yesid/seo-kit/og/fonts';

let files: readonly string[] | undefined;

export function inlinedOgFontFiles(): readonly string[] {
	if (files) return files;
	const folder = mkdtempSync(join(tmpdir(), 'yesid-og-fonts-'));
	files = ogFonts.map(({ name, weight, data }) => {
		const file = join(folder, `${name.replaceAll(' ', '')}-${weight}.ttf`);
		writeFileSync(file, new Uint8Array(data));
		return file;
	});
	return files;
}
