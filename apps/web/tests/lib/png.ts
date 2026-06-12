// Minimal dependency-free PNG pixel reader for PAINT-LEVEL e2e assertions.
//
// go2/w5 replay-rewind lesson: scroll-position assertions can all pass while
// the viewport paints a solid wall (the hero-text container stuck at a 200×
// scale covered every pixel in brand orange). Playwright screenshots are
// 8-bit non-interlaced PNGs, so a ~60-line standards-compliant decoder lets
// specs sample real painted pixels without adding an image dependency.

import { inflateSync } from 'node:zlib';

export interface DecodedPng {
	width: number;
	height: number;
	/** RGBA8, length width*height*4. */
	pixels: Uint8Array;
}

export type Rgb = readonly [number, number, number];

/** Decode an 8-bit RGB/RGBA non-interlaced PNG (Playwright screenshot shape). */
export function decodePng(buf: Buffer): DecodedPng {
	let off = 8; // skip signature
	let width = 0;
	let height = 0;
	let bitDepth = 0;
	let colorType = 0;
	let interlace = 0;
	const idat: Buffer[] = [];
	while (off < buf.length) {
		const len = buf.readUInt32BE(off);
		const type = buf.toString('ascii', off + 4, off + 8);
		const data = buf.subarray(off + 8, off + 8 + len);
		if (type === 'IHDR') {
			width = data.readUInt32BE(0);
			height = data.readUInt32BE(4);
			bitDepth = data[8];
			colorType = data[9];
			interlace = data[12];
		} else if (type === 'IDAT') {
			idat.push(data);
		} else if (type === 'IEND') {
			break;
		}
		off += 12 + len;
	}
	if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2) || interlace !== 0) {
		throw new Error(`unsupported PNG shape: depth=${bitDepth} color=${colorType} interlace=${interlace}`);
	}
	const bpp = colorType === 6 ? 4 : 3;
	const raw = inflateSync(Buffer.concat(idat));
	const stride = width * bpp;
	const pixels = new Uint8Array(width * height * 4);
	const prior = new Uint8Array(stride);
	const cur = new Uint8Array(stride);
	let p = 0;
	for (let y = 0; y < height; y++) {
		const filter = raw[p++];
		for (let x = 0; x < stride; x++) {
			const rawByte = raw[p + x];
			const a = x >= bpp ? cur[x - bpp] : 0; // left
			const b = prior[x]; // up
			const c = x >= bpp ? prior[x - bpp] : 0; // up-left
			let val: number;
			switch (filter) {
				case 0:
					val = rawByte;
					break;
				case 1:
					val = rawByte + a;
					break;
				case 2:
					val = rawByte + b;
					break;
				case 3:
					val = rawByte + ((a + b) >> 1);
					break;
				case 4: {
					const pa = Math.abs(b - c);
					const pb = Math.abs(a - c);
					const pc = Math.abs(a + b - 2 * c);
					val = rawByte + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
					break;
				}
				default:
					throw new Error(`bad PNG filter ${filter} at row ${y}`);
			}
			cur[x] = val & 0xff;
		}
		p += stride;
		for (let x = 0; x < width; x++) {
			const s = x * bpp;
			const d = (y * width + x) * 4;
			pixels[d] = cur[s];
			pixels[d + 1] = cur[s + 1];
			pixels[d + 2] = cur[s + 2];
			pixels[d + 3] = bpp === 4 ? cur[s + 3] : 255;
		}
		prior.set(cur);
	}
	return { width, height, pixels };
}

/** Sample the pixel at fractional viewport coordinates (DPR-agnostic). */
export function pixelAt(png: DecodedPng, fx: number, fy: number): Rgb {
	const x = Math.min(png.width - 1, Math.max(0, Math.round(fx * (png.width - 1))));
	const y = Math.min(png.height - 1, Math.max(0, Math.round(fy * (png.height - 1))));
	const i = (y * png.width + x) * 4;
	return [png.pixels[i], png.pixels[i + 1], png.pixels[i + 2]];
}

/**
 * Brand-orange detector for the orange-wall regression class. Matches the
 * primary tokens that ever paint the hero dot / Berri zoom fill — light
 * theme ≈ rgb(166,86,0), dark theme #E07800 = rgb(224,120,0) — while
 * rejecting page backgrounds (cream/charcoal), text inks and the muted art.
 */
export function isBrandOrange([r, g, b]: Rgb): boolean {
	return r > 130 && b < 90 && r - g > 50 && g - b > 40;
}
