// Vendored TTF fonts inlined as base64 data URLs at build time via Vite's
// `?inline` asset import. Bakes the bytes into the JS bundle so SvelteKit's
// `analyse` phase + Vercel's serverless output can load fonts at module init
// without a runtime filesystem lookup (which fails because Vite/Rollup
// doesn't copy binary assets adjacent to bundled JS).
//
// Trade ~1.2MB inlined into the function bundle for "just works" across
// dev, svelte-kit sync, vite build, Vercel Node serverless, and tests.
// Well under Vercel's 50MB function-bundle limit.

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./ttf-inline.d.ts" />
import interMediumDataUrl from './fonts/Inter-Medium.ttf?inline';
import interBlackDataUrl from './fonts/Inter-Black.ttf?inline';
import jetbrainsMonoDataUrl from './fonts/JetBrainsMono-Medium.ttf?inline';

export interface OgFont {
	name: string;
	data: Uint8Array;
	weight: 500 | 900;
	style: 'normal';
}

function decodeDataUrl(dataUrl: string): Uint8Array {
	const comma = dataUrl.indexOf(',');
	if (comma === -1) throw new Error('OG font: malformed data URL');
	const b64 = dataUrl.slice(comma + 1);
	const binStr = atob(b64);
	const bytes = new Uint8Array(binStr.length);
	for (let i = 0; i < bytes.length; i++) bytes[i] = binStr.charCodeAt(i);
	return bytes;
}

// Decode at module init so failures surface at cold-start. Module-scope
// const keeps buffers in memory across requests.
const FONTS: readonly OgFont[] = Object.freeze([
	{ name: 'Inter', data: decodeDataUrl(interMediumDataUrl), weight: 500, style: 'normal' },
	{ name: 'Inter', data: decodeDataUrl(interBlackDataUrl), weight: 900, style: 'normal' },
	{
		name: 'JetBrains Mono',
		data: decodeDataUrl(jetbrainsMonoDataUrl),
		weight: 500,
		style: 'normal',
	},
]);

export function getOgFonts(): readonly OgFont[] {
	return FONTS;
}
