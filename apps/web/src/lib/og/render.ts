import { Resvg } from '@resvg/resvg-js';
import { renderSatoriPng } from '@yesid/seo-kit/satori';
import { getOgFonts } from './fonts';

// Single chokepoint that wraps satori + resvg-js so the rasterizer is
// swappable from one file. Input is the POJO tree from template.ts.
export async function renderOgPng(tree: unknown): Promise<Uint8Array> {
	return renderSatoriPng(
		tree,
		{
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
		},
		(svg) => {
			const resvg = new Resvg(svg, {
				fitTo: { mode: 'width', value: 1200 },
			});
			return resvg.render().asPng();
		},
	);
}
