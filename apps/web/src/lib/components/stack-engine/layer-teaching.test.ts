// layer-teaching tests (go2/w5; go2 FR pass) — the single-source teaching lines
// are now LocalizedString ({ en, fr }), em-dash-free, and pinned EXACTLY: the
// legend, chip teach line, preview caption, and the zero-match composer all
// quote the EN values verbatim; the FR values are present for every layer.

import { describe, it, expect } from 'vitest';
import { STACK_LAYERS } from '@repo/shared/schemas';
import { LAYER_TEACHING } from './layer-teaching';

describe('LAYER_TEACHING', () => {
	it('covers every STACK_LAYERS entry with the exact spec wording (en) and a FR translation', () => {
		expect(Object.keys(LAYER_TEACHING).sort()).toEqual([...STACK_LAYERS].sort());
		expect(LAYER_TEACHING).toEqual({
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
		});
	});

	it('every layer carries a non-empty FR value, and no value (en or fr) uses an em-dash', () => {
		for (const layer of STACK_LAYERS) {
			const { en, fr } = LAYER_TEACHING[layer];
			expect(en.length).toBeGreaterThan(0);
			expect(fr?.length ?? 0).toBeGreaterThan(0);
			expect(en).not.toContain('—');
			expect(fr).not.toContain('—');
		}
	});
});
