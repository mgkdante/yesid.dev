// Shape morph data for SkillsJourney — Slice B+.
// Each keyword gets a start geometry (circle, square, etc.) that morphs
// into a meaning-specific icon via GSAP MorphSVGPlugin on scroll.
//
// All paths use a 64×64 viewBox. Target paths were converted from the
// reference SVGs in static/svg/ (which use <rect> elements) to <path>
// equivalents, since MorphSVGPlugin requires paths for morphing.
//
// Each shape has N paths (matching the number of rects in the reference).
// At start, all N paths render the SAME start geometry — they stack and
// look like one shape. On morph, they diverge into the distinct target
// pieces, creating a satisfying "one shape splits into many" effect.

export interface ShapeMorphConfig {
	/** The keyword this shape belongs to (lowercase) */
	keyword: string;
	/** SVG path for the initial geometric shape (circle, square, etc.) */
	startPath: string;
	/** SVG paths for each piece of the morphed target */
	targetPaths: readonly string[];
	/** Fill color matching the keyword's highlight color */
	color: string;
}

// --- Start geometries (64×64 viewBox, centered) ---

const CIRCLE = 'M32,12 A20,20 0 1,1 32,52 A20,20 0 1,1 32,12 Z';
const SQUARE = 'M16,16 H48 V48 H16 Z';
const TRIANGLE = 'M32,10 L54,50 H10 Z';
const HEXAGON = 'M32,8 L52,20 L52,44 L32,56 L12,44 L12,20 Z';
const DIAMOND = 'M32,10 L54,32 L32,54 L10,32 Z';

// --- Helper: rounded rect → path ---
// Converts <rect x y w h rx> to an SVG <path> d attribute.
// ry defaults to rx. rx is clamped to min(rx, w/2, h/2).
function rr(x: number, y: number, w: number, h: number, rx: number): string {
	const r = Math.min(rx, w / 2, h / 2);
	return [
		`M${x + r},${y}`,
		`H${x + w - r}`,
		`Q${x + w},${y} ${x + w},${y + r}`,
		`V${y + h - r}`,
		`Q${x + w},${y + h} ${x + w - r},${y + h}`,
		`H${x + r}`,
		`Q${x},${y + h} ${x},${y + h - r}`,
		`V${y + r}`,
		`Q${x},${y} ${x + r},${y}`,
		'Z',
	].join(' ');
}

// --- Morph configs per keyword ---

export const shapeMorphConfigs: readonly ShapeMorphConfig[] = [
	// Panel 1: "foundation" — circle → 3 bricks + base bar
	{
		keyword: 'foundation',
		startPath: CIRCLE,
		targetPaths: [
			rr(12, 14, 12, 10, 4),
			rr(26, 14, 12, 10, 4),
			rr(40, 14, 12, 10, 4),
			rr(8, 40, 48, 10, 5),
		],
		color: '#E07800',
	},

	// Panel 2: "data" — square → 4 stacked horizontal lines
	{
		keyword: 'data',
		startPath: SQUARE,
		targetPaths: [
			rr(12, 10, 40, 8, 4),
			rr(12, 22, 40, 8, 4),
			rr(12, 34, 40, 8, 4),
			rr(12, 46, 40, 8, 4),
		],
		color: '#E07800',
	},

	// Panel 2: "logic" — triangle → hierarchy tree (1-2-1 pattern)
	{
		keyword: 'logic',
		startPath: TRIANGLE,
		targetPaths: [
			rr(22, 8, 20, 8, 4),
			rr(8, 24, 20, 8, 4),
			rr(36, 24, 20, 8, 4),
			rr(22, 40, 20, 8, 4),
		],
		color: '#FFB627',
	},

	// Panel 2: "pixels" — hexagon → 2×2 grid of squares
	{
		keyword: 'pixels',
		startPath: HEXAGON,
		targetPaths: [
			rr(14, 14, 14, 14, 4),
			rr(36, 14, 14, 14, 4),
			rr(14, 36, 14, 14, 4),
			rr(36, 36, 14, 14, 4),
		],
		color: '#E07800',
	},

	// Panel 3: "stations" — circle → station layout (bar + rect + pills)
	{
		keyword: 'stations',
		startPath: CIRCLE,
		targetPaths: [
			rr(10, 10, 44, 8, 4),
			rr(16, 22, 32, 18, 4),
			rr(16, 46, 12, 6, 3),
			rr(36, 46, 12, 6, 3),
		],
		color: '#FFB627',
	},

	// Panel 3: "understand" — diamond → convergence (split→merge)
	{
		keyword: 'understand',
		startPath: DIAMOND,
		targetPaths: [
			rr(10, 12, 16, 8, 4),
			rr(38, 12, 16, 8, 4),
			rr(18, 28, 28, 8, 4),
			rr(12, 44, 40, 8, 4),
		],
		color: '#E07800',
	},

	// Panel 4: "motion" — triangle → dynamic ascending bars + vertical bar
	{
		keyword: 'motion',
		startPath: TRIANGLE,
		targetPaths: [
			rr(8, 16, 20, 8, 4),
			rr(16, 28, 24, 8, 4),
			rr(28, 40, 20, 8, 4),
			rr(40, 16, 12, 32, 6),
		],
		color: '#E07800',
	},

	// Panel 4: "unforgettable" — hexagon → 4 corner squares (1 bigger)
	{
		keyword: 'unforgettable',
		startPath: HEXAGON,
		targetPaths: [
			rr(12, 12, 16, 16, 4),
			rr(36, 12, 16, 16, 4),
			rr(12, 36, 16, 16, 4),
			rr(28, 28, 24, 24, 6),
		],
		color: '#E07800',
	},

	// CTA panel: "stop" — circle → octagon outline (4 bars)
	{
		keyword: 'stop',
		startPath: CIRCLE,
		targetPaths: [
			rr(20, 8, 24, 8, 4),
			rr(8, 20, 8, 24, 4),
			rr(48, 20, 8, 24, 4),
			rr(20, 48, 24, 8, 4),
		],
		color: '#FFB627',
	},
];

// Lookup by keyword for quick access in the component
export const shapeMorphByKeyword: ReadonlyMap<string, ShapeMorphConfig> = new Map(
	shapeMorphConfigs.map((c) => [c.keyword, c])
);
