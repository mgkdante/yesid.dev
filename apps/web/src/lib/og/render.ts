import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getOgFonts } from './fonts';

// Single chokepoint that wraps satori + resvg-js so the rasterizer is
// swappable from one file. Input is the POJO tree from template.ts.
export async function renderOgPng(tree: unknown): Promise<Uint8Array> {
	const svg = await satori(tree as Parameters<typeof satori>[0], {
		width: 1200,
		height: 630,
		fonts: getOgFonts().map((f) => ({
			name: f.name,
			// Satori's FontOptions.data accepts ArrayBuffer | Buffer; pass the
			// underlying buffer to satisfy strict lib.dom typing (zero-copy).
			data: f.data.buffer as ArrayBuffer,
			weight: f.weight,
			style: f.style,
		})),
	});

	const resvg = new Resvg(svg, {
		fitTo: { mode: 'width', value: 1200 },
	});
	return resvg.render().asPng();
}
