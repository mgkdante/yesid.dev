// layer-teaching tests (go2/w5; go2 FR pass; L1 ES pass) — the single-source
// teaching lines are LocalizedString ({ en, fr, es }), em-dash-free, and pinned
// EXACTLY: the legend, chip teach line, preview caption, and the zero-match
// composer all quote the EN values verbatim; FR and ES values are present for
// every layer.

import { describe, it, expect } from 'vitest';
import { STACK_LAYERS } from '@repo/shared/schemas';
import { LAYER_TEACHING } from './layer-teaching';

describe('LAYER_TEACHING', () => {
	it('covers every STACK_LAYERS entry with the exact spec wording (en) and FR + ES translations', () => {
		expect(Object.keys(LAYER_TEACHING).sort()).toEqual([...STACK_LAYERS].sort());
		expect(LAYER_TEACHING).toEqual({
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
		});
	});

	it('every layer carries non-empty FR + ES values, and no value uses an em-dash', () => {
		for (const layer of STACK_LAYERS) {
			const { en, fr, es } = LAYER_TEACHING[layer];
			expect(en.length).toBeGreaterThan(0);
			expect(fr?.length ?? 0).toBeGreaterThan(0);
			expect(es?.length ?? 0).toBeGreaterThan(0);
			expect(en).not.toContain('—');
			expect(fr).not.toContain('—');
			expect(es).not.toContain('—');
		}
	});
});
