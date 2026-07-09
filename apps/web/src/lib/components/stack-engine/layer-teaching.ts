// layer-teaching (go2/w5 — engine layered learning) — the ONE source for the
// engine's plain-language layer teaching lines.
//
// Reused by: the persistent layer legend (Engine.svelte), the chip teach line
// (TechMatcher.svelte), the preview caption (ProductPreview.svelte), and the
// zero-match project-shape composer (TechMatcher zero-match card).
//
// go2 FR pass + L1 ES pass: the teaching lines are LocalizedString
// ({ en, fr, es }) — the engine speaks Québécois and Spanish too. Consumers
// resolve via resolveLocale(value, locale). The layer KEYS
// (interface/logic/data/infra) stay verbatim — they double as the printed
// layer labels.

import type { StackLayer } from '@repo/shared/schemas';
import type { LocalizedString } from '$lib/types';

/** Printed layer names per locale (receiver r2): the canonical layer KEYS
 *  (interface/logic/data/infra) stay the ids in state, CSS hooks, and CMS
 *  data; these are the LABELS a visitor reads wherever a layer prints. */
export const LAYER_NAMES: Record<StackLayer, LocalizedString> = {
	interface: { en: 'interface', fr: 'interface', es: 'interfaz' },
	logic: { en: 'logic', fr: 'logique', es: 'lógica' },
	data: { en: 'data', fr: 'données', es: 'datos' },
	infra: { en: 'infra', fr: 'infra', es: 'infra' },
};

/** Homey-teacher one-liners: what each layer IS, in human words. */
export const LAYER_TEACHING: Record<StackLayer, LocalizedString> = {
	interface: {
		en: 'the part people see and touch',
		fr: 'la partie que le monde voit pis touche',
		es: 'la parte que la gente ve y toca',
	},
	logic: {
		en: 'the thinking part, rules and decisions',
		fr: 'la partie qui réfléchit, les règles pis les décisions',
		es: 'la parte que piensa, reglas y decisiones',
	},
	data: {
		en: 'the remembering part, where records live',
		fr: 'la partie qui se souvient, où les données restent',
		es: 'la parte que recuerda, donde viven los registros',
	},
	infra: {
		en: 'the ground it runs on, servers and deploys',
		fr: 'le terrain sur lequel ça roule, serveurs pis déploiements',
		es: 'el terreno donde corre, servidores y despliegues',
	},
};
