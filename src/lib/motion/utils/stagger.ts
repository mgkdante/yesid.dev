// Stagger timing calculator.
// Given an element index and a base delay, returns the delay in ms for that element.
// Adds slight randomization (±15% of baseDelay by default) per MOTION.md section 2:
// "Each element gets slightly randomized duration (±10-20% of base). Stagger + slight
// randomness = organic."
//
// WHY: Synchronized animations look robotic. A tiny random offset makes a grid of cards
// feel alive — like data arriving rather than marching in formation.

export interface StaggerOptions {
	// Whether to add randomization. Default: true.
	randomize?: boolean;
	// Fraction of baseDelay to use as the max variance. Default: 0.15 (15%).
	randomRange?: number;
}

export function stagger(index: number, baseDelay: number, options?: StaggerOptions): number {
	const { randomize = true, randomRange = 0.15 } = options ?? {};

	const base = index * baseDelay;

	if (!randomize || baseDelay === 0) return base;

	// Offset is ±(baseDelay * randomRange), centred at zero.
	const maxVariance = baseDelay * randomRange;
	const offset = (Math.random() * 2 - 1) * maxVariance;

	// Never return negative delays — the first element should never animate before it mounts.
	return Math.max(0, Math.round(base + offset));
}
