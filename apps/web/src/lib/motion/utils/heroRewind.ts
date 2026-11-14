const smooth = (value: number) => value * value * (3 - 2 * value);
const inverseCubicInOut = (value: number) => value < .5 ? Math.cbrt(value / 4) : 1 - Math.cbrt((1 - value) / 4);

// Rewind the existing 1.4s timeline without changing its scroll-down choreography.
// Invert the scale eases so both dot zooms get time, rather than front-loading a long scroll.
export function heroRewindEase(progress: number): number {
	const t = Math.min(1, Math.max(0, progress));
	if (t < .55) {
		// Spread the visible circle area across the zoom, with a soft start at scale=1.
		const zoom = t / .55;
		const area = zoom ** 3 * (zoom * (zoom * 6 - 15) + 10);
		const scale = (Math.sqrt(area + .0025) - .05) / (Math.sqrt(1.0025) - .05);
		return .25 * Math.cbrt(scale);
	}
	if (t < .6) return .25 + (1 / 14) * smooth((t - .55) / .05);
	if (t < .85) {
		const scale = 1 - smooth((t - .6) / .25);
		return 1 - (.65 + .3 * inverseCubicInOut(scale)) / 1.4;
	}
	return 15 / 28 + (13 / 28) * smooth((t - .85) / .15);
}
