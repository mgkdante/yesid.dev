import type { Buffer } from 'node:buffer';

export type FooterParityTheme = 'dark' | 'light';
export type FooterParityCapture = 'en-initial' | 'fr-after-navigation';

export interface BaselineArgs {
	mode: 'baseline';
	origin: string;
	outDir: string;
}

export interface CandidateArgs {
	mode: 'candidate';
	origin: string;
	baselineDir: string;
	outDir: string;
}

export interface Scenario {
	id: string;
	width: number;
	theme: FooterParityTheme;
	capture: FooterParityCapture;
	locale: 'en' | 'fr';
	route: '/' | '/fr';
}

export interface CssRect {
	left: number;
	top: number;
	width: number;
	height: number;
}

export interface PixelRect {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

export interface RgbaImage {
	width: number;
	height: number;
	pixels: Uint8Array;
}

export interface PixelDiff {
	dimensionsMatch: boolean;
	baselineDimensions: { width: number; height: number };
	candidateDimensions: { width: number; height: number };
	totalPixels: number | null;
	maskedPixels: number | null;
	comparedPixels: number | null;
	driftPixelsOutsideMasks: number | null;
	driftChannelsOutsideMasks: number | null;
	maxChannelDeltaOutsideMasks: number | null;
	pass: boolean;
}

export const WIDTHS: readonly number[];
export const THEMES: readonly FooterParityTheme[];
export const CAPTURES: readonly Readonly<{
	capture: FooterParityCapture;
	locale: 'en' | 'fr';
	route: '/' | '/fr';
}>[];

export function parseCliArgs(argv: string[]): BaselineArgs | CandidateArgs;
export function buildScenarioMatrix(): Scenario[];
export function buildVercelBypassHeaders(
	secret: string | undefined,
	origin: string,
): Record<string, string> | undefined;
export function findSystemDateMatch(text: string): {
	start: number;
	end: number;
	value: string;
};
export function findSystemDateNodeMatch(textNodes: string[]): {
	nodeIndex: number;
	start: number;
	end: number;
	value: string;
};
export function rasterizeCssRect(
	rect: CssRect,
	image: { width: number; height: number },
	footerCss: { width: number; height: number },
): PixelRect;
export function compareRgba(
	baseline: RgbaImage,
	candidate: RgbaImage,
	baselineMasks: PixelRect[],
	candidateMasks: PixelRect[],
): PixelDiff;
export function compareRects(
	baseline: unknown,
	candidate: unknown,
): {
	match: boolean;
	mismatchCount: number;
	maxAbsDeltaCss: number;
	deltas: Array<{
		path: string;
		baseline: number | null;
		candidate: number | null;
		delta: number | null;
	}>;
};
export function validateCaptureArtifact(
	capture: Record<string, unknown>,
	expected: Scenario,
	pngBuffer: Buffer,
	expectedOrigin: string,
): RgbaImage;
export function summarizeComparisons(
	comparisons: ReadonlyArray<{
		pass: boolean;
		pixelDiff: { driftPixelsOutsideMasks: number | null };
	}>,
): {
	comparisons: number;
	passing: number;
	failing: number;
	driftPixelsOutsideMasks: number;
	zeroPixelDriftOutsideMasks: boolean;
};
export function main(argv?: string[]): Promise<void>;
