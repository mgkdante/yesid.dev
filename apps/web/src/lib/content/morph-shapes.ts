// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// Geometric morph-target library (id, label, path, viewbox, sort). NEW in slice-18m — was previously derived from utils/shapes.ts SHAPES const.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { MorphShape } from '$lib/types';

export const morphShapes: readonly MorphShape[] = [
	{
		id: 'triangle',
		label: 'Triangle',
		path: 'M24 8 L40 38 L8 38 Z',
		sort: 1,
		viewbox: '0 0 48 48',
	},
	{
		id: 'circle',
		label: 'Circle',
		path: 'M24 8 A16 16 0 1 1 23.99 8 Z',
		sort: 2,
		viewbox: '0 0 48 48',
	},
	{
		id: 'square',
		label: 'Square',
		path: 'M10 10 L38 10 L38 38 L10 38 Z',
		sort: 3,
		viewbox: '0 0 48 48',
	},
	{
		id: 'hexagon',
		label: 'Hexagon',
		path: 'M24 7 L39 15.5 L39 32.5 L24 41 L9 32.5 L9 15.5 Z',
		sort: 4,
		viewbox: '0 0 48 48',
	},
];
