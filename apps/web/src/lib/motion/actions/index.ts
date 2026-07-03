// Motion actions barrel. PARITY FLIP (2026-07-03): the Tier-1 signature
// vocabulary now lives in @yesid/motion (vendored at design tag v0.1.0); the
// two Tier-2 actions (morphHover, scrollChain) stay app-local — they are
// component/scrub-coupled (MorphSVG helpers + ScrollTrigger scrub machinery)
// and are deliberately NOT extracted into the package (rule-of-three pending).
// The exported surface is byte-identical to yesid.dev @ 2bdb611d.

// Tier-1 (from @yesid/motion) — the 9-signature Snappy-Doctrine vocabulary:
export {
	boop,
	type BoopParams,
	magnetic,
	type MagneticParams,
	cursorGlow,
	type CursorGlowParams,
	sectionGlow,
	cardParallax,
	wordmarkHover,
	type WordmarkHoverParams,
	pressBounce,
} from '@yesid/motion/actions';

// Tier-2 (stay app-local):
export { morphHover, type MorphHoverParams } from './morphHover.js';
export { scrollChain } from './scrollChain.js';
