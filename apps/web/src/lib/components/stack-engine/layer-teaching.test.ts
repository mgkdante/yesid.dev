// layer-teaching tests (go2/w5) — the single-source teaching lines are pinned
// EXACTLY (spec wording): legend, chip teach line, preview caption, and the
// zero-match composer all quote these strings verbatim.

import { describe, it, expect } from 'vitest';
import { STACK_LAYERS } from '@repo/shared/schemas';
import { LAYER_TEACHING } from './layer-teaching';

describe('LAYER_TEACHING', () => {
	it('covers every STACK_LAYERS entry with the exact spec wording', () => {
		expect(Object.keys(LAYER_TEACHING).sort()).toEqual([...STACK_LAYERS].sort());
		expect(LAYER_TEACHING).toEqual({
			interface: 'the part people see and touch',
			logic: 'the thinking part — rules and decisions',
			data: 'the remembering part — where records live',
			infra: 'the ground it runs on — servers and deploys',
		});
	});
});
