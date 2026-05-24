import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface OgFont {
	name: string;
	data: Uint8Array;
	weight: 500 | 900;
	style: 'normal';
}

function loadSync(filename: string): Uint8Array {
	const url = new URL(`./fonts/${filename}`, import.meta.url);
	return new Uint8Array(readFileSync(fileURLToPath(url)));
}

// Eager load at module init so font failures surface at cold-start, not
// mid-request. Module-scope const keeps buffers in memory across requests.
const FONTS: readonly OgFont[] = Object.freeze([
	{ name: 'Inter', data: loadSync('Inter-Medium.ttf'), weight: 500, style: 'normal' },
	{ name: 'Inter', data: loadSync('Inter-Black.ttf'), weight: 900, style: 'normal' },
	{
		name: 'JetBrains Mono',
		data: loadSync('JetBrainsMono-Medium.ttf'),
		weight: 500,
		style: 'normal',
	},
]);

export function getOgFonts(): readonly OgFont[] {
	return FONTS;
}
