// Motion actions — Svelte actions for interaction signatures.
// The Snappy Doctrine limits this surface to the 9-signature vocabulary
// (boop, cursorGlow, magnetic, wordmarkHover, morphHover in 17e-5) + supporting types.

export { boop, type BoopParams } from './boop.js';
// reveal — deleted in 17e-2 (Snappy Doctrine forbids entrance actions)
export { magnetic, type MagneticParams } from './magnetic.js';
// ripple — deleted in 17e-2 (not in vocabulary)
// tilt — deleted in 17e-2 (absorbed into magnetic or cut)
export { cursorGlow, type CursorGlowParams } from './cursorGlow.js';
export { wordmarkHover, type WordmarkHoverParams } from './wordmarkHover.js';
export { morphHover, type MorphHoverParams } from './morphHover.js';
export { scrollChain } from './scrollChain.js';
export { pressBounce } from './pressBounce.js';
export { tapRipple } from './tapRipple.js';
