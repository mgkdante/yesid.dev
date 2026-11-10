// Rasterizes share cards with resvg. resvg-js only loads fonts from file paths,
// so callers pass them: Bun scripts use the package files, the prerender route
// writes the inlined fonts to disk once (font-files.ts).

import { createGlyphCoverage } from './glyph-coverage';
import { Resvg } from '@resvg/resvg-js';
import { buildOgCardSvg, escapeXml, OG_CARD_WIDTH, type MeasureText, type OgCard } from './card';

const MEASURE_SIZE = 100;

export interface OgCardRenderer {
	measure: MeasureText;
	svg(card: OgCard): string;
	png(card: OgCard): Uint8Array;
}

export function createOgCardRenderer(fontFiles: readonly string[]): OgCardRenderer {
	const font = { fontFiles: [...fontFiles], loadSystemFonts: false, defaultFontFamily: 'Inter' };
	const measured = new Map<string, { left: number; right: number; ascent: number; descent: number }>();

	// Glyph widths scale linearly, so one reference size and a cache are enough.
	const bounds = (text: string, { family, weight, tracking = 0 }: Parameters<MeasureText>[1]) => {
		const key = `${family}|${weight}|${tracking}|${text}`;
		const known = measured.get(key);
		if (known !== undefined) return known;
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="0" y="50" font-family="${family}" font-weight="${weight}" font-size="${MEASURE_SIZE}" letter-spacing="${tracking * MEASURE_SIZE}">${escapeXml(text)}</text></svg>`;
		const box = new Resvg(svg, { font }).getBBox();
		const width = box ? { left: box.x / MEASURE_SIZE, right: (box.x + box.width) / MEASURE_SIZE, ascent: (50 - box.y) / MEASURE_SIZE, descent: (box.y + box.height - 50) / MEASURE_SIZE } : { left: 0, right: 0, ascent: 0, descent: 0 };
		measured.set(key, width);
		return width;
	};

	const unsupported = createGlyphCoverage(fontFiles);
	const measure: MeasureText = Object.assign((text: string, spec: Parameters<MeasureText>[1]) => bounds(text, spec).right, { bounds, unsupported });
	const svg = (card: OgCard) => buildOgCardSvg(card, measure);
	return {
		measure,
		svg,
		png: (card) => new Resvg(svg(card), { font, fitTo: { mode: 'width', value: OG_CARD_WIDTH } }).render().asPng(),
	};
}
