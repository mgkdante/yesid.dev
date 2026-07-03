// PARITY FLIP (2026-07-03): re-export shim. The implementation now lives in
// @yesid/motion (vendored at design-system tag v0.1.0). Import paths are
// unchanged for all consumers; only the source of truth moved. Do not add
// logic here — upstream changes to the design repo, then re-sync.
export { cardParallax } from '@yesid/motion/actions';
