// layer-teaching (go2/w5 — engine layered learning) — the ONE source for the
// engine's plain-language layer teaching lines.
//
// Reused by: the persistent layer legend (Engine.svelte), the chip teach line
// (TechMatcher.svelte), the preview caption (ProductPreview.svelte), and the
// zero-match project-shape composer (TechMatcher zero-match card).
//
// go2 FR pass: the teaching lines are now LocalizedString ({ en, fr }) — the
// engine speaks Québécois too. Consumers resolve via resolveLocale(value,
// locale). The layer KEYS (interface/logic/data/infra) stay verbatim — they
// double as the printed layer labels.

import type { StackLayer } from '@repo/shared/schemas';
import type { LocalizedString } from '$lib/types';

/** Homey-teacher one-liners: what each layer IS, in human words. */
export const LAYER_TEACHING: Record<StackLayer, LocalizedString> = {
	interface: {
		en: 'the part people see and touch',
		fr: 'la partie que le monde voit pis touche',
	},
	logic: {
		en: 'the thinking part, rules and decisions',
		fr: 'la partie qui réfléchit, les règles pis les décisions',
	},
	data: {
		en: 'the remembering part, where records live',
		fr: 'la partie qui se souvient, où les données restent',
	},
	infra: {
		en: 'the ground it runs on, servers and deploys',
		fr: 'le terrain sur lequel ça roule, serveurs pis déploiements',
	},
};
