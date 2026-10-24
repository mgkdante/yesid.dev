// Invalid utility patterns silently render as transparent/currentColor. Keep
// this product gate aligned with the shared design preset.
import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { styleRegressionViolations } from '@yesid/gates';
import { YESID_FORBIDDEN } from '../../tools/design-gates';

const SRC = resolve(process.cwd(), 'src');

describe('style regressions — broken utilities & undefined vars', () => {
	for (const { pattern, reason, hits } of styleRegressionViolations({
		root: SRC,
		forbidden: YESID_FORBIDDEN,
	})) {
		it(`no source file matches ${pattern} (${reason})`, () => {
			expect(hits, hits.join('\n')).toEqual([]);
		});
	}
});
