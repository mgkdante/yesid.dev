// GSAP selector strings for every animated group inside Train.svelte.
// Slice 06 wires these up to ScrollTrigger timelines — this file keeps
// the selectors in one place so the SVG markup and the animation code
// stay in sync.

export const TRAIN_TARGETS = {
	root: '#yesid-train',
	glow: '#train-glow ellipse',
	stripe: '#train-stripe rect',
	wheels: '#train-wheels circle[r="9"]',
	lights: '#train-lights rect',
	windows: '#train-windows rect'
} as const;

export type TrainTarget = keyof typeof TRAIN_TARGETS;
