// layer-teaching (go2/w5 — engine layered learning) — the ONE source for the
// engine's plain-language layer teaching lines.
//
// Reused by: the persistent layer legend (Engine.svelte), the chip teach line
// (TechMatcher.svelte), the preview caption (ProductPreview.svelte), and the
// zero-match project-shape composer (TechMatcher zero-match card).
//
// Engine strings stay code-owned EN constants (house precedent: MODE_LABELS in
// Engine.svelte). CMS-backing engine copy is explicitly out of scope — noted
// as a follow-up only.

import type { StackLayer } from '@repo/shared/schemas';

/** Homey-teacher one-liners: what each layer IS, in human words. */
export const LAYER_TEACHING: Record<StackLayer, string> = {
	interface: 'the part people see and touch',
	logic: 'the thinking part — rules and decisions',
	data: 'the remembering part — where records live',
	infra: 'the ground it runs on — servers and deploys',
};
